var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import axios from "axios";
import { getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import z from "zod";
const sessionOptions = {
    password: process.env.YOLOTP_PRIVATE_KEY,
    cookieName: "yolotp",
};
function GET() {
    return __awaiter(this, void 0, void 0, function* () {
        const session = yield getIronSession(cookies(), sessionOptions);
        const loggedIn = session.email != null;
        return NextResponse.json({
            loggedIn,
            email: session.email,
        });
    });
}
const GetCodeCommand = z.object({
    email: z.string().email(),
});
const CheckCodeCommand = z.object({
    email: z.string().email(),
    code: z.string().min(6),
});
function POST(req) {
    return __awaiter(this, void 0, void 0, function* () {
        const json = yield req.json();
        const parseCheckCode = CheckCodeCommand.safeParse(json);
        if (parseCheckCode.success) {
            const res = yield axios.post("https://yolotp.com/api/check", {
                email: parseCheckCode.data.email,
                code: parseCheckCode.data.code,
            }, {
                headers: {
                    "x-api-key": process.env.YOLOTP_PRIVATE_KEY,
                },
            });
            if (!res.data.valid) {
                return NextResponse.json({ success: false });
            }
            const session = yield getIronSession(cookies(), sessionOptions);
            session.email = parseCheckCode.data.email;
            yield session.save();
            return NextResponse.json({ success: true });
        }
        const parseGetCode = GetCodeCommand.safeParse(json);
        if (parseGetCode.success) {
            yield axios.post("https://yolotp.com/api/new", { email: parseGetCode.data.email }, {
                headers: {
                    "x-api-key": process.env.YOLOTP_PRIVATE_KEY,
                },
            });
            return NextResponse.json({ success: true });
        }
        return NextResponse.json({ success: false });
    });
}
function DELETE() {
    return __awaiter(this, void 0, void 0, function* () {
        const session = yield getIronSession(cookies(), sessionOptions);
        session.destroy();
        return Response.json({ success: true });
    });
}
export const yolotpApiHandlers = { GET, POST, DELETE };
//# sourceMappingURL=api.js.map