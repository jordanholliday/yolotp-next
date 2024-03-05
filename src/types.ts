export interface User {
	id: string;
	email: string;
	active: boolean;
	type: string | null;
}

export type Session = {
	loggedIn: boolean;
	userId: string;
	cache: {
		user: User | null;
	}
};