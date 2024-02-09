// Copyright 2023 the Deno authors. All rights reserved. MIT license.
/**
 * This script prints all entries in the KV database formatted as JSON. This
 * can be used to create a backup file.
 *
 * @example
 * ```bash
 * deno task db:dump > backup.json
 * ```
 */
// import { kv } from "@/utils/db.ts";

const kv = await Deno.openKv()
// Deno.env.set("DENO_KV_ACCESS_TOKEN", "ddp_rvT9rbEoO0BntT77Twc1Rmus261tLr3PfWSR");
// const kv =await Deno.openKv("https://api.deno.com/databases/c5e94032-46ba-462b-8fd1-54fbb7d445d7/connect");

// https://github.com/GoogleChromeLabs/jsbi/issues/30#issuecomment-521460510
function replacer(_key: unknown, value: unknown) {
	return typeof value === 'bigint' ? value.toString() : value
}

const items = await Array.fromAsync(
	kv.list({ prefix: [] }),
	({ key, value }) => ({ key, value }),
)

// console.log(JSON.stringify(items, replacer, 2));
Deno.writeTextFileSync(
	'./triangle_data.json',
	JSON.stringify(items, replacer, 2),
)

kv.close()
