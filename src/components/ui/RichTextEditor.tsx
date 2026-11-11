import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import { Bold, Italic, List, ListOrdered, Heading2 } from 'lucide-react'
import { useState } from 'react'

interface RichTextEditorProps {
  content: string
  onChange: (html: string) => void
  placeholder?: string
  readOnly?: boolean
}

export function RichTextEditor({ content, onChange, placeholder = 'Write something...', readOnly = false }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML())
    },
  })

  if (!editor) return null

  if (readOnly) {
    return (
      <div style={viewerStyle}>
        <EditorContent editor={editor} />
      </div>
    )
  }

  return (
    <div style={editorWrapper}>
      <div style={toolbar}>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor.isActive('bold')}
          title="Bold"
        >
          <Bold size={14} />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor.isActive('italic')}
          title="Italic"
        >
          <Italic size={14} />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor.isActive('heading', { level: 2 })}
          title="Heading"
        >
          <Heading2 size={14} />
        </ToolBtn>
        <div style={{ width: 1, height: 16, background: 'var(--border)', margin: '0 2px' }} />
        <ToolBtn
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor.isActive('bulletList')}
          title="Bullet list"
        >
          <List size={14} />
        </ToolBtn>
        <ToolBtn
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor.isActive('orderedList')}
          title="Ordered list"
        >
          <ListOrdered size={14} />
        </ToolBtn>
      </div>
      <div style={editorArea}>
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}

function ToolBtn({ children, onClick, active, title }: { children: React.ReactNode; onClick: () => void; active: boolean; title?: string }) {
  const [hovered, setHovered] = useState(false)
  return (
    <button
      onClick={onClick}
      title={title}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: active ? 'var(--bg-active)' : hovered ? 'var(--bg-hover)' : 'transparent',
        border: 'none',
        color: active ? 'var(--accent)' : 'var(--text-secondary)',
        padding: '4px 6px',
        borderRadius: 4,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        transition: 'all 0.1s',
      }}
    >
      {children}
    </button>
  )
}

const editorWrapper: React.CSSProperties = {
  border: '1px solid var(--border)',
  borderRadius: 8,
  overflow: 'hidden',
  background: 'var(--bg-tertiary)',
}

const toolbar: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 2,
  padding: '6px 8px',
  borderBottom: '1px solid var(--border)',
  background: 'var(--bg-secondary)',
}

const editorArea: React.CSSProperties = {
  padding: '12px 14px',
  minHeight: 120,
}

const viewerStyle: React.CSSProperties = {
  color: 'var(--text-primary)',
  lineHeight: 1.6,
}
