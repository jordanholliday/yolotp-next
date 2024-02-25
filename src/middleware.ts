import { NextRequest } from "next/server";

import { getSession } from "./server";

interface GetMiddlewareProps {
	redirectPath: string;
	matcher: string | string[];
}

export function getMiddleware({ matcher, redirectPath }: GetMiddlewareProps) {
	 async function middleware(request: NextRequest) {
		const session = await getSession();
		if (!session.loggedIn) {
			return Response.redirect(`${request.nextUrl.origin}${redirectPath}`, 302);
		}
	}

	const config = { matcher };

	return { config, middleware };
}
