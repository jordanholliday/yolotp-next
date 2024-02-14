"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.yolotpApiHandlers = void 0;
const axios_1 = __importDefault(require("axios"));
const iron_session_1 = require("iron-session");
const headers_1 = require("next/headers");
const server_1 = require("next/server");
const zod_1 = __importDefault(require("zod"));
const sessionOptions = {
    password: process.env.YOLOTP_PRIVATE_KEY,
    cookieName: "yolotp",
};
function GET() {
    return __awaiter(this, void 0, void 0, function* () {
        const session = yield (0, iron_session_1.getIronSession)((0, headers_1.cookies)(), sessionOptions);
        const loggedIn = session.email != null;
        return server_1.NextResponse.json({
            loggedIn,
            email: session.email,
        });
    });
}
const GetCodeCommand = zod_1.default.object({
    email: zod_1.default.string().email(),
});
const CheckCodeCommand = zod_1.default.object({
    email: zod_1.default.string().email(),
    code: zod_1.default.string().min(6),
});
function POST(req) {
    return __awaiter(this, void 0, void 0, function* () {
        const json = yield req.json();
        const parseCheckCode = CheckCodeCommand.safeParse(json);
        if (parseCheckCode.success) {
            const res = yield axios_1.default.post("https://yolotp.com/api/check", {
                email: parseCheckCode.data.email,
                code: parseCheckCode.data.code,
            }, {
                headers: {
                    "x-api-key": process.env.YOLOTP_PRIVATE_KEY,
                },
            });
            if (!res.data.valid) {
                return server_1.NextResponse.json({ success: false });
            }
            const session = yield (0, iron_session_1.getIronSession)((0, headers_1.cookies)(), sessionOptions);
            session.email = parseCheckCode.data.email;
            yield session.save();
            return server_1.NextResponse.json({ success: true });
        }
        const parseGetCode = GetCodeCommand.safeParse(json);
        if (parseGetCode.success) {
            yield axios_1.default.post("https://yolotp.com/api/new", { email: parseGetCode.data.email }, {
                headers: {
                    "x-api-key": process.env.YOLOTP_PRIVATE_KEY,
                },
            });
            return server_1.NextResponse.json({ success: true });
        }
        return server_1.NextResponse.json({ success: false });
    });
}
function DELETE() {
    return __awaiter(this, void 0, void 0, function* () {
        const session = yield (0, iron_session_1.getIronSession)((0, headers_1.cookies)(), sessionOptions);
        session.destroy();
        return Response.json({ success: true });
    });
}
exports.yolotpApiHandlers = { GET, POST, DELETE };
//# sourceMappingURL=api.js.map