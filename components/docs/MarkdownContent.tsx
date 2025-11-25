"use client";

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Components } from 'react-markdown';

interface MarkdownContentProps {
    content: string;
    className?: string;
}

const markdownComponents: Components = {
    h1: ({ children }) => (
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-4 mt-8 first:mt-0">
            {children}
        </h1>
    ),
    h2: ({ children }) => (
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight mb-3 mt-6">
            {children}
        </h2>
    ),
    h3: ({ children }) => (
        <h3 className="text-lg md:text-xl font-semibold text-gray-900 mb-2 mt-4">
            {children}
        </h3>
    ),
    p: ({ children }) => (
        <p className="text-sm md:text-base text-gray-700 leading-relaxed mb-4">
            {children}
        </p>
    ),
    ul: ({ children }) => (
        <ul className="list-disc list-inside space-y-2 mb-4 text-gray-700">
            {children}
        </ul>
    ),
    ol: ({ children }) => (
        <ol className="list-decimal list-inside space-y-2 mb-4 text-gray-700">
            {children}
        </ol>
    ),
    li: ({ children }) => (
        <li className="text-sm md:text-base leading-relaxed">
            {children}
        </li>
    ),
    blockquote: ({ children }) => (
        <blockquote className="border-l-4 border-emerald-500 bg-emerald-50 pl-4 py-3 my-4 rounded-r-lg">
            <div className="text-sm md:text-base text-emerald-900">
                {children}
            </div>
        </blockquote>
    ),
    code: ({ inline, children, ...props }: any) => {
        if (inline) {
            return (
                <code className="px-1.5 py-0.5 bg-gray-100 text-emerald-700 rounded text-sm font-mono">
                    {children}
                </code>
            );
        }
        return (
            <code className="block bg-gray-900 text-gray-100 p-4 rounded-xl overflow-x-auto text-sm font-mono mb-4" {...props}>
                {children}
            </code>
        );
    },
    pre: ({ children }) => (
        <pre className="mb-4">
            {children}
        </pre>
    ),
    a: ({ href, children }) => (
        <a
            href={href}
            className="text-emerald-600 hover:text-emerald-700 underline font-medium transition-colors"
            target={href?.startsWith('http') ? '_blank' : undefined}
            rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
        >
            {children}
        </a>
    ),
    strong: ({ children }) => (
        <strong className="font-bold text-gray-900">
            {children}
        </strong>
    ),
    em: ({ children }) => (
        <em className="italic text-gray-700">
            {children}
        </em>
    ),
    hr: () => (
        <hr className="my-8 border-t-2 border-gray-200" />
    ),
    table: ({ children }) => (
        <div className="overflow-x-auto mb-4">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg">
                {children}
            </table>
        </div>
    ),
    thead: ({ children }) => (
        <thead className="bg-gray-50">
            {children}
        </thead>
    ),
    tbody: ({ children }) => (
        <tbody className="bg-white divide-y divide-gray-200">
            {children}
        </tbody>
    ),
    tr: ({ children }) => (
        <tr className="hover:bg-gray-50 transition-colors">
            {children}
        </tr>
    ),
    th: ({ children }) => (
        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
            {children}
        </th>
    ),
    td: ({ children }) => (
        <td className="px-4 py-3 text-sm text-gray-700">
            {children}
        </td>
    ),
};

export default function MarkdownContent({ content, className = '' }: MarkdownContentProps) {
    return (
        <div className={`prose prose-lg max-w-none ${className}`}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
            >
                {content}
            </ReactMarkdown>
        </div>
    );
}
