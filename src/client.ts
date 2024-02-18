import { useEffect, useState } from "react";
import useSWR from "swr";
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

	const [status, setStatus] = useState<SessionStatus>(
		SessionStatus.Initializing,
	);
	const { data: session, isLoading } = useSWR<Session>(
		config.apiRoute,
		fetchJson,
	);
	const { data: userData } = useSWR<{ data?: User }>(
		`${config.apiRoute}?user=true`,
		fetchJson,
	);

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
		isLoading,
		loginWithCode,
		logout,
		requestCode,
		session,
		user: userData?.data,
		status,
	};
}