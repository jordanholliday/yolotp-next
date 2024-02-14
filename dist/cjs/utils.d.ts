export declare enum SessionStatus {
    Initializing = 0,
    Pending = 1,
    Error = 2,
    LoggedOutEmailNeeded = 3,
    LoggedOutCodeNeeded = 4,
    LoggedIn = 5
}
export declare function useYolotp(): {
    isLoading: boolean;
    loginWithCode: import("swr/mutation").TriggerWithArgs<{
        success: boolean;
    }, any, "/api/auth", {
        code: string;
        email: string;
    }>;
    logout: import("swr/mutation").TriggerWithoutArgs<{
        success: boolean;
    }, any, "/api/auth", never>;
    requestCode: import("swr/mutation").TriggerWithArgs<{
        success: boolean;
    }, any, "/api/auth", {
        email: string;
    }>;
    session: {
        email?: string | undefined;
    } | undefined;
    status: SessionStatus;
};
