import axios from "axios";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import z from "zod";

import type { Session, User } from "./types";

const sessionOptions = {
	password: process.env.YOLOTP_SECRET_KEY as string,
	cookieName: "yolotp",
};


async function GET(req: NextRequest) {
	const searchParams = req.nextUrl.searchParams
	const isUserGET = searchParams.get('user')?.toLowerCase() === "true";
	const session = await getIronSession<Session>(
		cookies(),
		sessionOptions,
	);

	// base case - just return sessions data
	if (!isUserGET) {
		return NextResponse.json({
			userId: session.userId,
			loggedIn: session.loggedIn ?? false,
		});
	}

	// userGET - fetch latest user data and return
	if (!session.loggedIn || !session.userId) {
		return NextResponse.json({ data: null, });
	}

	const { data } = await axios.get<{ data: User }>(
		`https://yolotp.com/api/users/${session.userId}`,
		{
			headers: {
				"x-api-key": process.env.YOLOTP_SECRET_KEY,
			},
		},
	);
	return NextResponse.json({ data: data.data });
}

const GetCodeCommand = z.object({
	email: z.string().email(),
});

const CheckCodeCommand = z.object({
	email: z.string().email(),
	code: z.string().min(6),
});


type CheckCodeReponse =
	{ valid: false }
	| {
		valid: true;
		user: User
	}

async function POST(req: NextRequest) {
	const json: unknown = await req.json();

	const parseCheckCode = CheckCodeCommand.safeParse(json);
	if (parseCheckCode.success) {
		const res = await axios.post<CheckCodeReponse>(
			"https://yolotp.com/api/check",
			{
				email: parseCheckCode.data.email,
				code: parseCheckCode.data.code,
			},
			{
				headers: {
					"x-api-key": process.env.YOLOTP_SECRET_KEY,
				},
			},
		);

		if (!res.data.valid) {
			return NextResponse.json({ success: false });
		}

		const session = await getIronSession<Session>(
			cookies(),
			sessionOptions,
		);

		session.userId = res.data.user.id;
		session.loggedIn = res.data.user != null;
		await session.save();

		return NextResponse.json({ success: true });
	}

	const parseGetCode = GetCodeCommand.safeParse(json);
	if (parseGetCode.success) {
		await axios.post(
			"https://yolotp.com/api/new",
			{ email: parseGetCode.data.email },
			{
				headers: {
					"x-api-key": process.env.YOLOTP_SECRET_KEY,
				},
			},
		);
		return NextResponse.json({ success: true });
	}

	return NextResponse.json({ success: false });
}

async function DELETE() {
	const session = await getIronSession(cookies(), sessionOptions);
	session.destroy();
	return NextResponse.json({ success: true });
}

export { GET, POST, DELETE };