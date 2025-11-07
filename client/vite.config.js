import react from '@vitejs/plugin-react-swc';
import fs from 'fs';
import dotenv from 'dotenv';

import { defineConfig } from 'vite';

dotenv.config();

export default defineConfig({
    plugins: [react()],
    server: {
        https: {
            key: fs.readFileSync(process.env.VITE_SSL_KEY),
            cert: fs.readFileSync(process.env.VITE_SSL_CERT),
        },
    }
});
