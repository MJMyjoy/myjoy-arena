// ============================================
// PYODIDE WEB WORKER — Interactive input()
// Executes Python code in a separate thread.
// Uses SharedArrayBuffer + Atomics to pause
// execution when input() is called and wait
// for the user to type a value in the UI.
// ============================================
let pyodide = null;
let signalBuffer = null;  // Int32Array — [0]=signal, [1]=data length
let dataBuffer = null;    // Uint8Array — the actual input string bytes

importScripts('https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js');

async function initPyodide() {
    if (pyodide) return pyodide;
    pyodide = await loadPyodide();
    return pyodide;
}

// Called from Python when input() is used
function jsRequestInput(prompt) {
    // 1. Flush current stdout and send it + the prompt to main thread
    let partialOutput = '';
    try {
        partialOutput = pyodide.runPython('sys.stdout.getvalue()');
        pyodide.runPython('sys.stdout = __import__("io").StringIO()');
    } catch (_) {}

    self.postMessage({
        type: 'input-request',
        prompt: prompt || '',
        partialOutput: partialOutput
    });

    // 2. Block this thread until main thread provides the value
    Atomics.store(signalBuffer, 0, 0);
    Atomics.wait(signalBuffer, 0, 0);

    // 3. Read the input value from the shared data buffer
    const length = Atomics.load(signalBuffer, 1);
    const bytes = new Uint8Array(dataBuffer.buffer, 0, length);
    const value = new TextDecoder().decode(bytes);

    return value;
}

self.onmessage = async function(event) {
    const { type } = event.data;

    // Receive shared buffers from main thread
    if (type === 'init-buffers') {
        signalBuffer = new Int32Array(event.data.signal);
        dataBuffer = new Uint8Array(event.data.data);
        return;
    }

    if (type === 'run') {
        const { code } = event.data;
        try {
            const py = await initPyodide();

            // Reset stdout / stderr
            py.runPython([
                'import sys',
                'from io import StringIO',
                'sys.stdout = StringIO()',
                'sys.stderr = StringIO()',
            ].join('\n'));

            // Register the JS input function so Python can call it
            py.globals.set('_js_request_input', jsRequestInput);

            // Override builtins.input with our interactive version
            py.runPython([
                'import builtins',
                'def _interactive_input(prompt=""):',
                '    val = _js_request_input(str(prompt))',
                '    print(str(prompt) + val)',
                '    return val',
                'builtins.input = _interactive_input',
            ].join('\n'));

            // Clear global namespace to prevent variable leaking between runs
            py.runPython([
                '_to_keep = {"__name__", "__doc__", "__package__", "__loader__", "__spec__", "__annotations__", "__builtins__", "sys", "StringIO", "builtins", "_js_request_input", "_interactive_input"}',
                'for _k in list(globals().keys()):',
                '    if _k not in _to_keep and not _k.startswith("_"):',
                '        try:',
                '            del globals()[_k]',
                '        except Exception:',
                '            pass',
            ].join('\n'));

            // Execute user code
            py.runPython(code);

            // Get remaining output
            const stdout = py.runPython('sys.stdout.getvalue()');
            const stderr = py.runPython('sys.stderr.getvalue()');
            self.postMessage({ type: 'result', success: true, output: stdout, error: stderr });

        } catch (e) {
            let stderr = '';
            try {
                if (pyodide) stderr = pyodide.runPython('sys.stderr.getvalue()');
            } catch (_) {}

            // Get any partial stdout that was printed before the error
            let partialOutput = '';
            try {
                if (pyodide) partialOutput = pyodide.runPython('sys.stdout.getvalue()');
            } catch (_) {}

            self.postMessage({
                type: 'result',
                success: false,
                output: partialOutput,
                error: e.message || stderr || String(e)
            });
        }
    }
};

// Preload Pyodide
initPyodide().then(function() {
    self.postMessage({ type: 'ready' });
}).catch(function(e) {
    self.postMessage({ type: 'error', error: 'Impossible de charger Python : ' + e.message });
});