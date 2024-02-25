import { useEffect, useState } from "react";
import useSWR, { BareFetcher } from "swr";
import useSWRMutation from "swr/mutation";
import z from "zod";

import type { Session, User } from "./types";

const GetCodeCommand = z.object({
	email: z.string().email(),
});

const CheckCodeCommand = z.object({
	email: z.string().email(),
	code: z.string().min(6),
});

export enum SessionStatus {
	Initializing,
	Pending,
	Error,

	LoggedOutEmailNeeded,
	LoggedOutCodeNeeded,
	LoggedIn,
}

async function fetchJson<JSON = unknown>(
	url: string,
	init?: RequestInit,
): Promise<JSON> {
	return fetch(url, {
		headers: {
			accept: "application/json",
			"content-type": "application/json",
		},
		...init,
	}).then((res) => res.json() as JSON);
}

interface UseYolotpProps {
	apiRoute?: string;
}

const DEFAULT_PROPS: { apiRoute: NonNullable<UseYolotpProps["apiRoute"]> } = {
	apiRoute: "/api/auth",
}

export function useYolotp(props: UseYolotpProps = {}) {
	const config = { ...DEFAULT_PROPS, ...props };
	const [status, setStatus] = useState<SessionStatus>(SessionStatus.Initializing);

	// fetch session
	const sessionFetcher: BareFetcher<Session> = () => fetchJson(config.apiRoute);
	const { data: session } = useSWR<Session>(config.apiRoute, sessionFetcher);

	// fetch user
	const userFetcher: BareFetcher<{ data?: User }> = () => fetchJson(
		`${config.apiRoute}?user=true&trigger=${session?.loggedIn ? "true" : "false"}`
	);
	const { data: userData, isLoading: userDataIsLoading } = useSWR<{ data?: User }>(config.apiRoute, userFetcher);

	// initialize SessionStatus
	useEffect(() => {
		if (status !== SessionStatus.Initializing) return;
		if (session == null) return; // session is initially null, wait till we have some value

		setStatus(
			session?.userId != null
				? SessionStatus.LoggedIn
				: SessionStatus.LoggedOutEmailNeeded,
		);
	}, [session, status]);

	async function doRequestCode(
		url: string,
		{ arg }: { arg: z.infer<typeof GetCodeCommand> },
	) {
		setStatus(SessionStatus.Pending);
		const res = await fetchJson<{ success: boolean }>(url, {
			method: "POST",
			body: JSON.stringify(arg),
		});
		setStatus(SessionStatus.LoggedOutCodeNeeded);
		return res;
	}

	async function doLoginWithCode(
		url: string,
		{ arg }: { arg: z.infer<typeof CheckCodeCommand> },
	) {
		setStatus(SessionStatus.Pending);
		const res = await fetchJson<{ success: boolean }>(url, {
			method: "POST",
			body: JSON.stringify(arg),
		});

		setStatus(
			res.success
				? SessionStatus.LoggedIn
				: SessionStatus.LoggedOutCodeNeeded,
		);
		return res;
	}

	function doLogout(url: string) {
		setStatus(SessionStatus.Pending);
		const res = fetchJson<{ success: boolean }>(url, {
			method: "DELETE",
		});
		setStatus(SessionStatus.LoggedOutEmailNeeded);
		return res;
	}

	const { trigger: requestCode } = useSWRMutation(
		config.apiRoute,
		doRequestCode,
	);
	const { trigger: loginWithCode } = useSWRMutation(
		config.apiRoute,
		doLoginWithCode,
	);
	const { trigger: logout } = useSWRMutation(config.apiRoute, doLogout);

	return {
		loginWithCode,
		logout,
		requestCode,
		user: userData?.data,
		userIsLoading: userDataIsLoading,
		status,
	};
}