import axios from "axios";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import z from "zod";

const sessionOptions = {
	password: process.env.YOLOTP_SECRET_KEY as string,
	cookieName: "yolotp",
};

interface SessionData {
	email?: string;
	loggedIn: boolean;
}

interface User {
	id: string;
	email: string;
	active: boolean;
	type: string | null;
}

async function GET() {
	const session = await getIronSession<Omit<SessionData, "loggedIn">>(
		cookies(),
		sessionOptions,
	);
	const loggedIn = session.email != null;
	return NextResponse.json({
		loggedIn,
		email: session.email,
	});
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
		user: User;
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

		const session = await getIronSession<{user: User}>(
			cookies(),
			sessionOptions,
		);
		session.user = res.data.user;

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