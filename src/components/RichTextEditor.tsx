import { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { ActionIcon, Group, Paper, Tooltip } from '@mantine/core';
import { 
  IconBold, 
  IconItalic, 
  IconUnderline, 
  IconAlignLeft, 
  IconAlignCenter, 
  IconAlignRight, 
  IconAlignJustified,
  IconH1,
  IconH2,
  IconH3
} from '@tabler/icons-react';

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  // Track local content to prevent cursor jumping
  const [localContent, setLocalContent] = useState(content);
  
  // Initialize editor with optimized extensions to avoid duplicates
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // StarterKit already includes bold and italic, so we don't need to add them separately
        // This prevents the duplicate extension warnings
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right', 'justify'],
        defaultAlignment: 'left',
      }),
    ],
    content: localContent,
    onUpdate: ({ editor }) => {
      // Update local content first
      const newContent = editor.getHTML();
      setLocalContent(newContent);
      
      // Then notify parent component
      onChange(newContent);
    },
    editorProps: {
      attributes: {
        class: 'rich-text-editor-content',
        style: 'outline: none; padding: 0.5rem; min-height: 150px;',
      },
    },
  });
  
  // Only update editor content when external content changes and differs from local content
  useEffect(() => {
    if (editor && content !== localContent) {
      // Store cursor position
      const { from, to } = editor.state.selection;
      
      // Update content
      setLocalContent(content);
      editor.commands.setContent(content);
      
      // Restore cursor position if possible
      if (from !== to) {
        editor.commands.setTextSelection({ from, to });
      }
    }
  }, [content, editor, localContent]);

  if (!editor) {
    return null;
  }

  return (
    <Paper withBorder p={0}>
      <Group p="xs" style={{ borderBottom: '1px solid #e9ecef' }}>
        <Tooltip label="Bold">
          <ActionIcon
            variant={editor.isActive('bold') ? 'filled' : 'subtle'}
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
          >
            <IconBold size={16} />
          </ActionIcon>
        </Tooltip>
        
        <Tooltip label="Italic">
          <ActionIcon
            variant={editor.isActive('italic') ? 'filled' : 'subtle'}
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
          >
            <IconItalic size={16} />
          </ActionIcon>
        </Tooltip>
        
        <Tooltip label="Underline">
          <ActionIcon
            variant={editor.isActive('underline') ? 'filled' : 'subtle'}
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            disabled={!editor.can().chain().focus().toggleUnderline().run()}
          >
            <IconUnderline size={16} />
          </ActionIcon>
        </Tooltip>

        <div style={{ width: 1, height: 24, backgroundColor: '#e9ecef', margin: '0 0.5rem' }} />

        <Tooltip label="Heading 1">
          <ActionIcon
            variant={editor.isActive('heading', { level: 1 }) ? 'filled' : 'subtle'}
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          >
            <IconH1 size={16} />
          </ActionIcon>
        </Tooltip>

        <Tooltip label="Heading 2">
          <ActionIcon
            variant={editor.isActive('heading', { level: 2 }) ? 'filled' : 'subtle'}
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          >
            <IconH2 size={16} />
          </ActionIcon>
        </Tooltip>

        <Tooltip label="Heading 3">
          <ActionIcon
            variant={editor.isActive('heading', { level: 3 }) ? 'filled' : 'subtle'}
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          >
            <IconH3 size={16} />
          </ActionIcon>
        </Tooltip>

        <div style={{ width: 1, height: 24, backgroundColor: '#e9ecef', margin: '0 0.5rem' }} />

        <Tooltip label="Align Left">
          <ActionIcon
            variant={editor.isActive({ textAlign: 'left' }) ? 'filled' : 'subtle'}
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
          >
            <IconAlignLeft size={16} />
          </ActionIcon>
        </Tooltip>

        <Tooltip label="Align Center">
          <ActionIcon
            variant={editor.isActive({ textAlign: 'center' }) ? 'filled' : 'subtle'}
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
          >
            <IconAlignCenter size={16} />
          </ActionIcon>
        </Tooltip>

        <Tooltip label="Align Right">
          <ActionIcon
            variant={editor.isActive({ textAlign: 'right' }) ? 'filled' : 'subtle'}
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
          >
            <IconAlignRight size={16} />
          </ActionIcon>
        </Tooltip>

        <Tooltip label="Justify">
          <ActionIcon
            variant={editor.isActive({ textAlign: 'justify' }) ? 'filled' : 'subtle'}
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
          >
            <IconAlignJustified size={16} />
          </ActionIcon>
        </Tooltip>
      </Group>

      <EditorContent editor={editor} />

      <style>{`
        .rich-text-editor-content p {
          margin: 0.5rem 0;
        }
        .rich-text-editor-content h1, 
        .rich-text-editor-content h2, 
        .rich-text-editor-content h3 {
          margin: 1rem 0 0.5rem 0;
        }
      `}</style>
    </Paper>
  );
}
