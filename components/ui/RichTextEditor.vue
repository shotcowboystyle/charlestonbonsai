<script setup lang="ts">
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import StarterKit from '@tiptap/starter-kit'
import { EditorContent, useEditor } from '@tiptap/vue-3'

interface Props {
  modelValue?: string
  label?: string
  placeholder?: string
  required?: boolean
  error?: string
  hint?: string
  disabled?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Start writing...',
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const editor = useEditor({
  content: props.modelValue || '',
  editable: !props.disabled,
  extensions: [
    StarterKit.configure({
      bulletList: { keepMarks: true, keepAttributes: false },
      orderedList: { keepMarks: true, keepAttributes: false },
    }),
    Underline,
    Placeholder.configure({ placeholder: props.placeholder }),
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
  ],
  onUpdate: ({ editor }) => {
    const html = editor.getHTML()
    // Emit empty string when content is just empty paragraph
    emit('update:modelValue', html === '<p></p>' ? '' : html)
  },
})

// Sync external modelValue changes (e.g. when editing form loads data)
watch(
  () => props.modelValue,
  (val) => {
    if (!editor.value)
      return
    const current = editor.value.getHTML()
    const incoming = val || ''
    if (current !== incoming)
      editor.value.commands.setContent(incoming)
  },
)

// Sync disabled state
watch(
  () => props.disabled,
  (val) => {
    editor.value?.setEditable(!val)
  },
)

onBeforeUnmount(() => editor.value?.destroy())

function isActive(type: string, attrs?: Record<string, any>) {
  return editor.value?.isActive(type, attrs) ?? false
}

// Toolbar actions
const tools = [
  {
    id: 'bold',
    title: 'Bold',
    action: () => editor.value?.chain().focus().toggleBold().run(),
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/><path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/></svg>`,
  },
  {
    id: 'italic',
    title: 'Italic',
    action: () => editor.value?.chain().focus().toggleItalic().run(),
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="4" x2="10" y2="4"/><line x1="14" y1="20" x2="5" y2="20"/><line x1="15" y1="4" x2="9" y2="20"/></svg>`,
  },
  {
    id: 'underline',
    title: 'Underline',
    action: () => editor.value?.chain().focus().toggleUnderline().run(),
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3v7a6 6 0 0 0 6 6 6 6 0 0 0 6-6V3"/><line x1="4" y1="21" x2="20" y2="21"/></svg>`,
  },
  { id: 'sep1', separator: true },
  {
    id: 'heading2',
    title: 'Heading 2',
    action: () => editor.value?.chain().focus().toggleHeading({ level: 2 }).run(),
    activeCheck: () => isActive('heading', { level: 2 }),
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1"/></svg>`,
  },
  {
    id: 'heading3',
    title: 'Heading 3',
    action: () => editor.value?.chain().focus().toggleHeading({ level: 3 }).run(),
    activeCheck: () => isActive('heading', { level: 3 }),
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4 12h8"/><path d="M4 18V6"/><path d="M12 18V6"/><path d="M17.5 10.5c1.7-1 3.5 0 3.5 1.5a2 2 0 0 1-2 2"/><path d="M17 17.5c2 1.5 4 .3 4-1.5a2 2 0 0 0-2-2"/></svg>`,
  },
  { id: 'sep2', separator: true },
  {
    id: 'bulletList',
    title: 'Bullet List',
    action: () => editor.value?.chain().focus().toggleBulletList().run(),
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/><circle cx="4" cy="6" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1" fill="currentColor" stroke="none"/></svg>`,
  },
  {
    id: 'orderedList',
    title: 'Ordered List',
    action: () => editor.value?.chain().focus().toggleOrderedList().run(),
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="10" y1="6" x2="21" y2="6"/><line x1="10" y1="12" x2="21" y2="12"/><line x1="10" y1="18" x2="21" y2="18"/><path d="M4 6h1v4"/><path d="M4 10h2"/><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/></svg>`,
  },
  { id: 'sep3', separator: true },
  {
    id: 'blockquote',
    title: 'Blockquote',
    action: () => editor.value?.chain().focus().toggleBlockquote().run(),
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"/></svg>`,
  },
  {
    id: 'hr',
    title: 'Divider',
    action: () => editor.value?.chain().focus().setHorizontalRule().run(),
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><line x1="3" y1="12" x2="21" y2="12"/></svg>`,
  },
  { id: 'sep4', separator: true },
  {
    id: 'undo',
    title: 'Undo',
    action: () => editor.value?.chain().focus().undo().run(),
    noActiveState: true,
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7v6h6"/><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13"/></svg>`,
  },
  {
    id: 'redo',
    title: 'Redo',
    action: () => editor.value?.chain().focus().redo().run(),
    noActiveState: true,
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 7v6h-6"/><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6 2.3L21 13"/></svg>`,
  },
]
</script>

<template>
  <div class="w-full">
    <!-- Label -->
    <label v-if="label" class="block text-sm font-medium text-charcoal mb-1.5">
      {{ label }}
      <span v-if="required" class="text-red-500">*</span>
    </label>

    <!-- Editor wrapper -->
    <div
      class="rich-editor rounded-lg border transition-all duration-200 overflow-hidden"
      :class="[
        error
          ? 'border-red-500 ring-1 ring-red-500'
          : 'border-stone-200 focus-within:ring-2 focus-within:ring-sage focus-within:border-transparent',
        disabled ? 'opacity-60 pointer-events-none bg-cream-100' : 'bg-white',
      ]"
    >
      <!-- Toolbar -->
      <div class="rich-editor-toolbar flex flex-wrap items-center gap-0.5 px-3 py-2 border-b border-stone-100 bg-stone-50">
        <template v-for="tool in tools" :key="tool.id">
          <!-- Separator -->
          <span v-if="'separator' in tool && tool.separator" class="w-px h-5 bg-stone-200 mx-1" />

          <!-- Button -->
          <button
            v-else
            type="button"
            :title="tool.title"
            class="rich-editor-btn w-7 h-7 rounded flex items-center justify-center transition-colors duration-150"
            :class="[
              ('activeCheck' in tool ? tool.activeCheck?.() : isActive(tool.id))
                ? 'bg-sage text-white shadow-sm'
                : 'text-stone-500 hover:bg-stone-200 hover:text-charcoal',
            ]"
            @click="tool.action?.()"
            v-html="tool.icon"
          />
        </template>
      </div>

      <!-- Content area -->
      <EditorContent
        :editor="editor"
        class="rich-editor-content"
      />
    </div>

    <!-- Error / Hint -->
    <p v-if="error" class="mt-1.5 text-sm text-red-500">
      {{ error }}
    </p>
    <p v-else-if="hint" class="mt-1.5 text-sm text-stone-500">
      {{ hint }}
    </p>
  </div>
</template>

<style>
/* Editor prose content styles */
.rich-editor-content .tiptap {
  min-height: 180px;
  padding: 0.875rem 1rem;
  outline: none;
  font-size: 0.9375rem;
  line-height: 1.7;
  color: #2c2c2c;
}

.rich-editor-content .tiptap p.is-editor-empty:first-child::before {
  content: attr(data-placeholder);
  color: #a8a29e;
  pointer-events: none;
  float: left;
  height: 0;
}

.rich-editor-content .tiptap h2 {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a1a1a;
  margin: 1rem 0 0.5rem;
  line-height: 1.3;
}

.rich-editor-content .tiptap h3 {
  font-family: 'Playfair Display', Georgia, serif;
  font-size: 1.05rem;
  font-weight: 600;
  color: #1a1a1a;
  margin: 0.875rem 0 0.375rem;
  line-height: 1.3;
}

.rich-editor-content .tiptap p {
  margin: 0 0 0.75rem;
}

.rich-editor-content .tiptap p:last-child {
  margin-bottom: 0;
}

.rich-editor-content .tiptap strong {
  font-weight: 700;
}

.rich-editor-content .tiptap em {
  font-style: italic;
}

.rich-editor-content .tiptap u {
  text-decoration: underline;
}

.rich-editor-content .tiptap ul {
  list-style-type: disc;
  padding-left: 1.5rem;
  margin: 0.5rem 0 0.75rem;
}

.rich-editor-content .tiptap ol {
  list-style-type: decimal;
  padding-left: 1.5rem;
  margin: 0.5rem 0 0.75rem;
}

.rich-editor-content .tiptap li {
  margin-bottom: 0.25rem;
}

.rich-editor-content .tiptap blockquote {
  border-left: 3px solid #8a9e7a;
  padding-left: 1rem;
  margin: 0.75rem 0;
  color: #57534e;
  font-style: italic;
}

.rich-editor-content .tiptap hr {
  border: none;
  border-top: 1px solid #e7e5e4;
  margin: 1rem 0;
}

/* Toolbar icon sizing */
.rich-editor-btn svg {
  width: 14px;
  height: 14px;
}
</style>
