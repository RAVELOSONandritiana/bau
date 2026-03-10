import { defineConfig } from 'vite';
import type { RollupWarning, WarningHandlerWithDefault } from 'rollup';

export default defineConfig({
    server:{
        allowedHosts: true,
        host: '0.0.0.0'
    },
    build: {
        rollupOptions: {
            onwarn(warning: RollupWarning, warn: WarningHandlerWithDefault) {
                // Suppress "The above dynamic import cannot be analyzed by Vite" warnings
                // These are caused by ng2-pdf-viewer/pdfjs-dist usage which is handled at runtime
                if (
                    warning.message.includes('dynamic import cannot be analyzed') &&
                    (warning.id?.includes('ng2-pdf-viewer') || warning.id?.includes('pdfjs-dist') || warning.id?.includes('chunk-'))
                ) {
                    return;
                }
                warn(warning);
            },
        },
    },
});
