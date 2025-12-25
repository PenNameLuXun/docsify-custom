Prism.languages.dts = {
  'comment': [
    {
      pattern: /\/\*[\s\S]*?\*\//,
      greedy: true
    },
    {
      pattern: /\/\/.*/,
      greedy: true
    }
  ],
  'string': {
    pattern: /"(?:\\.|[^"\\])*"/,
    greedy: true
  },
  'number': /\b(0x[\da-fA-F]+|\d+)\b/,
  'label': {
    pattern: /\b[a-zA-Z_][\w-]*\s*:/,
    alias: 'symbol'
  },
  'keyword': /\b(compatible|model|reg|device_type|status|interrupts|ranges|#address-cells|#size-cells|interrupt-controller)\b/,
  'property': {
    pattern: /\b[a-zA-Z_][\w-]*\b(?=\s*=)/,
    alias: 'attr-name'
  },
  'punctuation': /[{};<>]/,
  'operator': /=/
};


Prism.languages.fidl = {
  'comment': [
    {
      pattern: /\/\*[\s\S]*?\*\//,
      greedy: true
    },
    {
      pattern: /\/\/.*/,
      greedy: true
    }
  ],
  'string': {
    pattern: /"(?:\\.|[^"\\])*"/,
    greedy: true
  },
  'keyword': /\b(?:protocol|package|import|interface|struct|union|enum|enumeration|ByteBuffer|method|broadcast|Boolean|array|version|major|typedef|minor|table|bits|const|using|as|in|out|vector|handle|nullable|request|event|library|service|reserved|true|false|void)\b/,
  'type': /\b(?:bool|Int8|Int16|Int32|Int64|uint8|uint16|uint32|uint64|UInt8|UInt16|UInt32|UInt64|String|float32|float64|Float|Double|string|handle|handle\<\w+\>)\b/,
  'number': /\b\d+(\.\d+)?\b/,
  'constant': /\b[A-Z_][A-Z0-9_]*\b/,
  'punctuation': /[{}[\]();:,<>]/,
  'operator': /[=|&]/,
  'identifier': /\b[a-zA-Z_]\w*\b/
};
Prism.languages.fdepl=Prism.languages.fidl;