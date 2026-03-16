declare module "pg-copy-streams" {
    import { Writable } from "stream"
    export function from(query: string): Writable
    export function to(query: string): import("stream").Readable
}
