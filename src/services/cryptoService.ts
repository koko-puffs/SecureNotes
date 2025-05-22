interface EncryptedData {
    ciphertext: Uint8Array;
    iv: Uint8Array;
}

const cryptoService = {
    async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
        if (!(salt instanceof Uint8Array)) {
            throw new Error("Salt must be a Uint8Array.");
        }
        const enc = new TextEncoder();
        const keyMaterial = await window.crypto.subtle.importKey(
            "raw",
            enc.encode(password),
            { name: "PBKDF2" },
            false,
            ["deriveKey"]
        );
        return window.crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: salt,
                iterations: 250000, // Makes bruteforcing much harder as the process has been made much slower
                hash: "SHA-256",
            },
            keyMaterial,
            { 
                name: "AES-GCM", 
                length: 256 
            },
            true,
            ["encrypt", "decrypt"]
        );
    },

    async encryptNote(plaintext: string, key: CryptoKey): Promise<EncryptedData> {
        const enc = new TextEncoder();
        const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96 bit IV
        const encodedPlaintext = enc.encode(plaintext);

        const ciphertextBuffer = await window.crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: iv,
            },
            key,
            encodedPlaintext
        );
        return { ciphertext: new Uint8Array(ciphertextBuffer), iv: iv };
    },

    async decryptNote(ciphertext: Uint8Array, iv: Uint8Array, key: CryptoKey): Promise<string> {
        if (!(ciphertext instanceof Uint8Array)) throw new Error("Ciphertext must be Uint8Array");
        if (!(iv instanceof Uint8Array)) throw new Error("IV must be Uint8Array");

        try {
            const decryptedBuffer = await window.crypto.subtle.decrypt(
                {
                    name: "AES-GCM",
                    iv: iv,
                },
                key,
                ciphertext
            );
            const dec = new TextDecoder();
            return dec.decode(decryptedBuffer);
        } catch (error) {
            console.error("Decryption failed in cryptoService:", error);
            throw new Error("Failed to decrypt note. The key might be incorrect or data corrupted.");
        }
    },

    uint8ArrayToBase64(array: Uint8Array): string {
        let binary = '';
        const len = array.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(array[i]);
        }
        return window.btoa(binary);
    },

    base64ToUint8Array(base64: string): Uint8Array {
        const binary_string = window.atob(base64);
        const len = binary_string.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binary_string.charCodeAt(i);
        }
        return bytes;
    }
};

export default cryptoService;