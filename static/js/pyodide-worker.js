// ============================================
// PYODIDE WEB WORKER — Interactive input()
// Re-execution approach: when input() is hit
// without a pre-filled value, raises a special
// exception. Main thread catches it, shows an
// input field, then re-runs with all collected
// inputs. No SharedArrayBuffer needed.
// ============================================
let pyodide = null;

importScripts('https://cdn.jsdelivr.net/pyodide/v0.24.1/full/pyodide.js');

async function initPyodide() {
    if (pyodide) return pyodide;
    pyodide = await loadPyodide();
    return pyodide;
}

self.onmessage = async function(event) {
    const { type, code, inputs } = event.data;

    if (type === 'run') {
        try {
            const py = await initPyodide();

            // Reset stdout / stderr
            py.runPython([
                'import sys',
                'from io import StringIO',
                'sys.stdout = StringIO()',
                'sys.stderr = StringIO()',
            ].join('\n'));

            // Setup custom input with pre-filled values
            // If values run out, raise a special marker exception
            py.runPython([
                'import builtins',
                '_input_values = []',
                '_input_index = 0',
                'class _InputNeeded(Exception):',
                '    def __init__(self, prompt):',
                '        self.prompt = prompt',
                '        super().__init__("__INPUT_NEEDED__:" + str(prompt))',
                'def _custom_input(prompt=""):',
                '    global _input_index',
                '    if _input_index < len(_input_values):',
                '        val = _input_values[_input_index]',
                '        _input_index += 1',
                '        print(str(prompt) + val)',
                '        return val',
                '    raise _InputNeeded(prompt)',
                'builtins.input = _custom_input',
            ].join('\n'));

            // Set pre-filled input values
            if (inputs && inputs.length > 0) {
                py.runPython('_input_values = ' + JSON.stringify(inputs) + '\n_input_index = 0');
            } else {
                py.runPython('_input_values = []\n_input_index = 0');
            }

            // Clear global namespace to prevent variable leaking between runs
            py.runPython([
                '_to_keep = {"__name__", "__doc__", "__package__", "__loader__", "__spec__", "__annotations__", "__builtins__", "sys", "StringIO", "builtins", "_input_values", "_input_index", "_custom_input", "_InputNeeded"}',
                'for _k in list(globals().keys()):',
                '    if _k not in _to_keep and not _k.startswith("_"):',
                '        try:',
                '            del globals()[_k]',
                '        except Exception:',
                '            pass',
            ].join('\n'));

            // Execute user code
            py.runPython(code);

            // Success — get output
            const stdout = py.runPython('sys.stdout.getvalue()');
            const stderr = py.runPython('sys.stderr.getvalue()');
            self.postMessage({ type: 'result', success: true, output: stdout, error: stderr });

        } catch (e) {
            const errorMsg = e.message || String(e);

            // Check if it's our special "input needed" marker
            if (errorMsg.includes('__INPUT_NEEDED__:')) {
                const prompt = errorMsg.split('__INPUT_NEEDED__:').pop();
                let partialOutput = '';
                try {
                    partialOutput = pyodide.runPython('sys.stdout.getvalue()');
                } catch (_) {}
                self.postMessage({
                    type: 'input-needed',
                    prompt: prompt,
                    partialOutput: partialOutput
                });
            } else {
                // Real error
                let stderr = '';
                try {
                    if (pyodide) stderr = pyodide.runPython('sys.stderr.getvalue()');
                } catch (_) {}
                let partialOutput = '';
                try {
                    if (pyodide) partialOutput = pyodide.runPython('sys.stdout.getvalue()');
                } catch (_) {}
                self.postMessage({
                    type: 'result',
                    success: false,
                    output: partialOutput,
                    error: errorMsg || stderr
                });
            }
        }
    }
};

// Preload Pyodide
initPyodide().then(function() {
    self.postMessage({ type: 'ready' });
}).catch(function(e) {
    self.postMessage({ type: 'error', error: 'Impossible de charger Python : ' + e.message });
});