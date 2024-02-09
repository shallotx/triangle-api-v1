export interface Discussion_Type {
	id: string
	code: string
	is_active: boolean
	name: string
}
export interface Links {
	id: string
	link_type: string
	href: string
	name: string
}

export interface Virtual_Meeting {
	id: string
	name: string
	note: string
	href: string
	meeting_time: string
	is_active: boolean
}

export interface Meeting_Type {
	id: string
	code: string
	is_active: boolean
	name: string
}

export interface Donation_Code {
	id: string
	name: string
	code: string
	is_active: boolean
	notes: string
}

export interface Product {
	id: string
	account: string
	is_test_mode: boolean
	name: string
	price: number
	stripe_price_id: string
	stripe_product_id: string
	product_type: string
	is_active: boolean
}

export interface AdminUserKV {
	id: string
	firstname: string
	lastname: string
	phone: string
	email: string
	isActive: boolean
	isSuper: boolean
	password: string
	salt: string
}

export interface Address {
	city: string
	street: string
}
