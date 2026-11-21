import { describe, expect, it } from "vitest";
import { createHash, randomBytes } from "node:crypto";
import { Sha256Stream } from "@/lib/client/sha256-stream";

const ref = (b: Uint8Array) => createHash("sha256").update(b).digest("hex");
const stream = (b: Uint8Array, chunk: number) => {
  const s = new Sha256Stream();
  for (let i = 0; i < b.length; i += chunk) s.update(b.subarray(i, i + chunk));
  return s.digestHex();
};

describe("Sha256Stream", () => {
  it("matches the standard test vectors", () => {
    expect(new Sha256Stream().digestHex()).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
    expect(new Sha256Stream().update(new TextEncoder().encode("abc")).digestHex()).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
    expect(
      new Sha256Stream()
        .update(new TextEncoder().encode("abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq"))
        .digestHex(),
    ).toBe("248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1");
  });
  it("matches Node's crypto for sizes around the block and padding boundaries, in any chunking", () => {
    for (const size of [0, 1, 55, 56, 57, 63, 64, 65, 119, 120, 121, 127, 128, 129, 1000, 65536, 100_000]) {
      const data = randomBytes(size);
      const expected = ref(data);
      for (const chunk of [1, 7, 63, 64, 65, 1000, 70_000]) expect(stream(data, chunk)).toBe(expected);
    }
  });
  it("handles a multi-megabyte input", () => {
    const data = randomBytes(8 * 1024 * 1024 + 13);
    expect(stream(data, 1024 * 1024)).toBe(ref(data));
  });
  it("matches the EICAR test string fingerprint", () => {
    const eicar = "X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*";
    expect(new Sha256Stream().update(new TextEncoder().encode(eicar)).digestHex()).toBe(
      "275a021bbfb6489e54d471899f7db9d1663fc695ec2fe2a2c4538aabf651fd0f",
    );
  });
});
