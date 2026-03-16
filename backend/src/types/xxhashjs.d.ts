declare module "xxhashjs" {
    interface XXH64 {
        update(data: string | Buffer | Uint8Array): XXH64
        digest(): { toString(radix?: number): string }
    }
    interface XXH {
        h64(seed: number): XXH64
    }
    const XXH: XXH
    export default XXH
}
