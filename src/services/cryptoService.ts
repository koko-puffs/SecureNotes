interface EncryptedData {
    ciphertext: Uint8Array;
    iv: Uint8Array;
}

const cryptoService = {
    /**
     * Generates a cryptographically strong salt.
     * @param length The desired length of the salt in bytes. Defaults to 16.
     * @returns A Uint8Array containing the salt.
     */
    generateSalt(length: number = 16): Uint8Array {
        const array = new Uint8Array(length);
        window.crypto.getRandomValues(array);
        return array;
    },

    /**
     * Derives an encryption key from a password and salt using PBKDF2.
     * @param password The user's password.
     * @param salt A Uint8Array salt.
     * @returns A Promise that resolves to a CryptoKey suitable for AES-GCM.
     */
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
                iterations: 250000, // OWASP recommendation
                hash: "SHA-256",
            },
            keyMaterial,
            { name: "AES-GCM", length: 256 },
            true,
            ["encrypt", "decrypt"]
        );
    },

    /**
     * Encrypts plaintext using AES-GCM.
     * @param plaintext The string to encrypt.
     * @param key The CryptoKey to use for encryption.
     * @returns A Promise that resolves to an object containing the ciphertext and IV as Uint8Arrays.
     */
    async encryptNote(plaintext: string, key: CryptoKey): Promise<EncryptedData> {
        const enc = new TextEncoder();
        const iv = window.crypto.getRandomValues(new Uint8Array(12)); // 96-bit IV is recommended for GCM
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

    /**
     * Decrypts ciphertext using AES-GCM.
     * @param ciphertext A Uint8Array of the encrypted data.
     * @param iv A Uint8Array of the Initialization Vector.
     * @param key The CryptoKey to use for decryption.
     * @returns A Promise that resolves to the decrypted plaintext string.
     * @throws Will throw an error if decryption fails (e.g., wrong key, corrupted data).
     */
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

    /**
     * Converts a Uint8Array to a Base64 string.
     * @param array The Uint8Array to convert.
     * @returns The Base64 encoded string.
     */
    uint8ArrayToBase64(array: Uint8Array): string {
        let binary = '';
        const len = array.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(array[i]);
        }
        return window.btoa(binary);
    },

    /**
     * Converts a Base64 string to a Uint8Array.
     * @param base64 The Base64 string to convert.
     * @returns The corresponding Uint8Array.
     */
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