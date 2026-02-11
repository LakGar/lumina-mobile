import { $generateHtmlFromNodes, $generateNodesFromDOM } from "@lexical/html";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  ListItemNode,
  ListNode,
  registerList,
} from "@lexical/list";
import { LexicalComposer } from "@lexical/react/LexicalComposer";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { ContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import type { EditorState } from "lexical";
import {
  $createParagraphNode,
  $getRoot,
  $insertNodes,
  FORMAT_TEXT_COMMAND,
  REDO_COMMAND,
  UNDO_COMMAND,
} from "lexical";
import { useEffect, useRef } from "react";

const theme = {
  paragraph: "editor-paragraph",
  text: {
    bold: "editor-text-bold",
    italic: "editor-text-italic",
    underline: "editor-text-underline",
  },
};

function send(obj: Record<string, unknown>) {
  const w = (
    window as unknown as {
      ReactNativeWebView?: { postMessage: (s: string) => void };
    }
  ).ReactNativeWebView;
  if (w?.postMessage) w.postMessage(JSON.stringify(obj));
}

function BridgePlugin() {
  const [editor] = useLexicalComposerContext();
  const initialContentSet = useRef(false);

  useEffect(() => {
    const removeUpdate = editor.registerUpdateListener(
      ({ editorState }: { editorState: EditorState }) => {
        editorState.read(() => {
          const html = $generateHtmlFromNodes(editor, null);
          send({ type: "content", html });
        });
      },
    );
    return () => removeUpdate();
  }, [editor]);

  useEffect(() => {
    (
      window as unknown as {
        __editorCommand?: (cmd: string, value?: string) => void;
      }
    ).__editorCommand = (cmd: string, value?: string) => {
      try {
        if (cmd === "focus") {
          editor.focus();
          return;
        }
        if (cmd === "setContent") {
          editor.update(() => {
            const root = $getRoot();
            root.clear();
            const s = value != null && value !== "" ? value : "";
            if (
              !s ||
              s.trim() === "" ||
              s.trim() === "<p><br></p>" ||
              s.trim() === "<p><br/>"
            ) {
              const p = $createParagraphNode();
              root.append(p);
              return;
            }
            const parser = new DOMParser();
            const dom = parser.parseFromString(s, "text/html");
            const nodes = $generateNodesFromDOM(editor, dom);
            if (nodes.length) {
              $insertNodes(nodes);
            } else {
              const p = $createParagraphNode();
              root.append(p);
            }
          });
          initialContentSet.current = true;
          return;
        }
        if (cmd === "bold") {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "bold");
          return;
        }
        if (cmd === "italic") {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "italic");
          return;
        }
        if (cmd === "underline") {
          editor.dispatchCommand(FORMAT_TEXT_COMMAND, "underline");
          return;
        }
        if (cmd === "bulletList") {
          editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
          return;
        }
        if (cmd === "orderedList") {
          editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
          return;
        }
        if (cmd === "undo") {
          editor.dispatchCommand(UNDO_COMMAND, undefined);
          return;
        }
        if (cmd === "redo") {
          editor.dispatchCommand(REDO_COMMAND, undefined);
          return;
        }
        if (cmd === "insertImage" && value) {
          // Lexical doesn't have built-in image by default; could add @lexical/react ImagePlugin
          // For now no-op or insert a placeholder
        }
      } catch (e) {
        send({ type: "error", message: String(e) });
      }
    };
    send({ type: "ready" });
    return () => {
      delete (window as unknown as { __editorCommand?: unknown })
        .__editorCommand;
    };
  }, [editor]);

  return null;
}

function ListCommandPlugin() {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    return registerList(editor);
  }, [editor]);
  return null;
}

function FocusBlurPlugin() {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    const root = editor.getRootElement();
    if (!root) return;
    const onFocus = () => send({ type: "focus" });
    const onBlur = () => send({ type: "blur" });
    root.addEventListener("focus", onFocus);
    root.addEventListener("blur", onBlur);
    return () => {
      root.removeEventListener("focus", onFocus);
      root.removeEventListener("blur", onBlur);
    };
  }, [editor]);
  return null;
}

function Placeholder() {
  return <div className="editor-placeholder">Write your entry…</div>;
}

export default function App() {
  const initialConfig = {
    namespace: "EntryEditor",
    theme,
    onError: (e: Error) => console.error(e),
    nodes: [ListNode, ListItemNode],
  };

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className="editor-shell">
        <RichTextPlugin
          contentEditable={<ContentEditable />}
          placeholder={<Placeholder />}
          ErrorBoundary={LexicalErrorBoundary}
        />
        <HistoryPlugin />
        <ListPlugin />
        <ListCommandPlugin />
        <BridgePlugin />
        <FocusBlurPlugin />
      </div>
    </LexicalComposer>
  );
}
