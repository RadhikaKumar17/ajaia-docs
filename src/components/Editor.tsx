"use client";

import { useEditor, EditorContent, type Editor as TiptapEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect } from "react";

interface EditorProps {
  initialContent: string;
  editable: boolean;
  onChange?: (html: string) => void;
}

function ToolbarButton({
  active,
  disabled,
  onClick,
  label,
  title,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  label: React.ReactNode;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      disabled={disabled}
      className={`min-w-8 rounded-md px-2 py-1 text-sm transition ${
        active ? "bg-gray-900 text-white" : "text-gray-700 hover:bg-gray-100"
      } disabled:opacity-40`}
    >
      {label}
    </button>
  );
}

function Toolbar({ editor }: { editor: TiptapEditor }) {
  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-gray-200 bg-white px-2 py-2">
      <ToolbarButton
        title="Bold (Ctrl/Cmd+B)"
        active={editor.isActive("bold")}
        onClick={() => editor.chain().focus().toggleBold().run()}
        label={<span className="font-bold">B</span>}
      />
      <ToolbarButton
        title="Italic (Ctrl/Cmd+I)"
        active={editor.isActive("italic")}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        label={<span className="italic">I</span>}
      />
      <ToolbarButton
        title="Underline (Ctrl/Cmd+U)"
        active={editor.isActive("underline")}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        label={<span className="underline">U</span>}
      />

      <span className="mx-1 h-5 w-px bg-gray-200" />

      <ToolbarButton
        title="Heading 1"
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        label="H1"
      />
      <ToolbarButton
        title="Heading 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        label="H2"
      />
      <ToolbarButton
        title="Heading 3"
        active={editor.isActive("heading", { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        label="H3"
      />
      <ToolbarButton
        title="Normal text"
        active={editor.isActive("paragraph")}
        onClick={() => editor.chain().focus().setParagraph().run()}
        label="¶"
      />

      <span className="mx-1 h-5 w-px bg-gray-200" />

      <ToolbarButton
        title="Bulleted list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        label="• List"
      />
      <ToolbarButton
        title="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        label="1. List"
      />
      <ToolbarButton
        title="Quote"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        label="❝"
      />

      <span className="mx-1 h-5 w-px bg-gray-200" />

      <ToolbarButton
        title="Undo"
        disabled={!editor.can().undo()}
        onClick={() => editor.chain().focus().undo().run()}
        label="↶"
      />
      <ToolbarButton
        title="Redo"
        disabled={!editor.can().redo()}
        onClick={() => editor.chain().focus().redo().run()}
        label="↷"
      />
    </div>
  );
}

export default function Editor({ initialContent, editable, onChange }: EditorProps) {
  const editor = useEditor({
    // Avoid SSR hydration mismatch — render editor on the client only.
    immediatelyRender: false,
    editable,
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder: "Start writing…" }),
    ],
    content: initialContent || "",
    editorProps: {
      attributes: {
        class: "prose-doc min-h-[60vh] px-6 py-6 focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editor, editable]);

  if (!editor) {
    return (
      <div className="min-h-[60vh] px-6 py-6 text-sm text-gray-400">Loading editor…</div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      {editable && <Toolbar editor={editor} />}
      <EditorContent editor={editor} />
    </div>
  );
}
