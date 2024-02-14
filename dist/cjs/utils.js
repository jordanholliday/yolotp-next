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
exports.useYolotp = exports.SessionStatus = void 0;
const react_1 = require("react");
const swr_1 = __importDefault(require("swr"));
const mutation_1 = __importDefault(require("swr/mutation"));
const zod_1 = __importDefault(require("zod"));
const sessionApiRoute = "/api/auth";
const GetCodeCommand = zod_1.default.object({
    email: zod_1.default.string().email(),
});
const CheckCodeCommand = zod_1.default.object({
    email: zod_1.default.string().email(),
    code: zod_1.default.string().min(6),
});
var SessionStatus;
(function (SessionStatus) {
    SessionStatus[SessionStatus["Initializing"] = 0] = "Initializing";
    SessionStatus[SessionStatus["Pending"] = 1] = "Pending";
    SessionStatus[SessionStatus["Error"] = 2] = "Error";
    SessionStatus[SessionStatus["LoggedOutEmailNeeded"] = 3] = "LoggedOutEmailNeeded";
    SessionStatus[SessionStatus["LoggedOutCodeNeeded"] = 4] = "LoggedOutCodeNeeded";
    SessionStatus[SessionStatus["LoggedIn"] = 5] = "LoggedIn";
})(SessionStatus || (exports.SessionStatus = SessionStatus = {}));
function fetchJson(input, init) {
    return __awaiter(this, void 0, void 0, function* () {
        return fetch(sessionApiRoute, Object.assign({ headers: {
                accept: "application/json",
                "content-type": "application/json",
            } }, init)).then((res) => res.json());
    });
}
function useYolotp() {
    const [status, setStatus] = (0, react_1.useState)(SessionStatus.Initializing);
    const { data: session, isLoading } = (0, swr_1.default)(sessionApiRoute, fetchJson);
    (0, react_1.useEffect)(() => {
        if (status !== SessionStatus.Initializing)
            return;
        if (session == null)
            return; // session is initially null, wait till we have some value
        setStatus((session === null || session === void 0 ? void 0 : session.email) != null
            ? SessionStatus.LoggedIn
            : SessionStatus.LoggedOutEmailNeeded);
    }, [session, status]);
    function doRequestCode(url, { arg }) {
        return __awaiter(this, void 0, void 0, function* () {
            setStatus(SessionStatus.Pending);
            const res = yield fetchJson(url, {
                method: "POST",
                body: JSON.stringify(arg),
            });
            setStatus(SessionStatus.LoggedOutCodeNeeded);
            return res;
        });
    }
    function doLoginWithCode(url, { arg }) {
        return __awaiter(this, void 0, void 0, function* () {
            setStatus(SessionStatus.Pending);
            const res = yield fetchJson(url, {
                method: "POST",
                body: JSON.stringify(arg),
            });
            setStatus(res.success
                ? SessionStatus.LoggedIn
                : SessionStatus.LoggedOutCodeNeeded);
            return res;
        });
    }
    function doLogout(url) {
        setStatus(SessionStatus.Pending);
        const res = fetchJson(url, {
            method: "DELETE",
        });
        setStatus(SessionStatus.LoggedOutEmailNeeded);
        return res;
    }
    const { trigger: requestCode } = (0, mutation_1.default)(sessionApiRoute, doRequestCode);
    const { trigger: loginWithCode } = (0, mutation_1.default)(sessionApiRoute, doLoginWithCode);
    const { trigger: logout } = (0, mutation_1.default)(sessionApiRoute, doLogout);
    return {
        isLoading,
        loginWithCode,
        logout,
        requestCode,
        session,
        status,
    };
}
exports.useYolotp = useYolotp;
//# sourceMappingURL=utils.js.map