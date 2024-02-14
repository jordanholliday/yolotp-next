import { type NextRequest, NextResponse } from "next/server";
declare function GET(): Promise<NextResponse<{
    loggedIn: boolean;
    email: string | undefined;
}>>;
declare function POST(req: NextRequest): Promise<NextResponse<{
    success: boolean;
}>>;
declare function DELETE(): Promise<Response>;
export declare const yolotpApiHandlers: {
    GET: typeof GET;
    POST: typeof POST;
    DELETE: typeof DELETE;
};
export {};
