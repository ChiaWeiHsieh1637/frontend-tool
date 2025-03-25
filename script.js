document.addEventListener('DOMContentLoaded', function() {
    // 初始化元素引用
    const frameworkSelect = document.getElementById('framework');
    const generateBtn = document.getElementById('generateBtn');
    const copyBtn = document.getElementById('copyBtn');
    const downloadBtn = document.getElementById('downloadBtn');
    
    // 框架切換事件
    frameworkSelect.addEventListener('change', function() {
        const isVue = this.value === 'vue';
        document.querySelectorAll('.component-type-group, .hooks-group').forEach(el => {
            el.style.display = isVue ? 'none' : 'block';
        });
    });

    // 初始化隱藏 Vue 不適用的選項
    if (frameworkSelect.value === 'vue') {
        document.querySelectorAll('.component-type-group, .hooks-group').forEach(el => {
            el.style.display = 'none';
        });
    }

    // 產生元件按鈕事件
    generateBtn.addEventListener('click', generateComponent);
    
    // 複製按鈕事件
    copyBtn.addEventListener('click', copyToClipboard);
    
    // 下載按鈕事件
    downloadBtn.addEventListener('click', downloadFile);
});

function generateComponent() {
    const input = document.getElementById('filename').value.trim();
    const framework = document.getElementById('framework').value;
    
    if (!input) {
        alert('請輸入元件名稱！');
        return;
    }

    const componentName = formatComponentName(input);
    const outputElement = document.getElementById('output');
    
    let template = framework === 'vue' 
        ? generateVueComponent(componentName) 
        : generateReactComponent(componentName);

    outputElement.textContent = template;
    Prism.highlightElement(outputElement);
}

function formatComponentName(input) {
    return input
        .split(/\s+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join('');
}

function generateVueComponent(componentName) {
    const templateType = document.getElementById('templateType').value;
    const useProps = document.getElementById('useProps').checked;
    const useStyles = document.getElementById('useStyles').checked;

    // 模板內容配置
    const templates = {
        basic: `<h1>{{ title }}</h1>
        <slot></slot>`,
        form: `<form @submit.prevent="handleSubmit">
            <div class="form-group">
                <label>表單標題</label>
                <input v-model="formData.title" type="text">
            </div>
            <slot name="form-content"></slot>
            <button type="submit">提交</button>
        </form>`,
        list: `<ul class="item-list">
            <li v-for="(item, index) in items" :key="index" @click="selectItem(item)">
                {{ item.text }}
            </li>
        </ul>`,
        layout: `<div class="layout-container">
            <header class="header">
                <slot name="header"></slot>
            </header>
            <main class="content">
                <slot></slot>
            </main>
            <footer class="footer">
                <slot name="footer"></slot>
            </footer>
        </div>`
    };

    // 腳本內容配置
    const scripts = {
        form: `data() {
        return {
            formData: {
                title: ''
            }
        };
    },
    methods: {
        handleSubmit() {
            this.$emit('submit', this.formData);
        }
    }`,
        list: `data() {
        return {
            items: [
                { id: 1, text: '項目 1' },
                { id: 2, text: '項目 2' }
            ]
        };
    },
    methods: {
        selectItem(item) {
            this.$emit('select', item);
        }
    }`,
        default: `data() {
        return {
            title: '${componentName}'
        };
    }`
    };

    const templateContent = templates[templateType] || templates.basic;
    const scriptContent = scripts[templateType === 'form' ? 'form' : templateType === 'list' ? 'list' : 'default'];

    // 樣式內容配置
    const styles = {
        form: `.form-group {
    margin-bottom: 1rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
}

.form-group input {
    width: 100%;
    padding: 0.5rem;
}`,
        list: `.item-list {
    list-style: none;
    padding: 0;
}

.item-list li {
    padding: 0.5rem;
    border-bottom: 1px solid #eee;
    cursor: pointer;
}

.item-list li:hover {
    background-color: #f5f5f5;
}`,
        layout: `.layout-container {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
}

.header, .footer {
    padding: 1rem;
    background-color: #f0f0f0;
}

.content {
    flex: 1;
    padding: 1rem;
}`,
        default: `.${componentName.toLowerCase()}-container {
    padding: 1rem;
}`
    };

    const styleContent = useStyles 
        ? `<style scoped>
.${componentName.toLowerCase()}-container {
    padding: 1rem;
}

${styles[templateType] || ''}
</style>` 
        : '';

    return `<template>
    <div class="${componentName.toLowerCase()}-container">
        ${templateContent}
    </div>
</template>

<script>
export default {
    ${useProps ? `props: {
        initialData: {
            type: Object,
            default: () => ({})
        }
    },
    ` : ''}
    ${scriptContent}
}
</script>

${styleContent}`;
}

function generateReactComponent(componentName) {
    const templateType = document.getElementById('templateType').value;
    const isFunction = document.getElementById('funcComponent').checked;
    const useProps = document.getElementById('useProps').checked;
    const useStyles = document.getElementById('useStyles').checked;
    const useHooks = document.getElementById('useHooks').checked;

    // 模板內容配置
    const templates = {
        basic: `<h1>${componentName}</h1>
        {children}`,
        form: `<form onSubmit={handleSubmit}>
            <div className="form-group">
                <label>表單標題</label>
                <input 
                    type="text" 
                    value={formData.title} 
                    onChange={(e) => setFormData({...formData, title: e.target.value})} 
                />
            </div>
            {children}
            <button type="submit">提交</button>
        </form>`,
        list: `<ul className="item-list">
            {items.map((item) => (
                <li 
                    key={item.id} 
                    onClick={() => onSelectItem(item)}
                >
                    {item.text}
                </li>
            ))}
        </ul>`,
        layout: `<div className="layout-container">
            <header className="header">
                {header || <h1>${componentName}</h1>}
            </header>
            <main className="content">
                {children}
            </main>
            <footer className="footer">
                {footer || <p>© 2023 ${componentName}</p>}
            </footer>
        </div>`
    };

    // 邏輯內容配置
    const logics = {
        form: `${useHooks ? `const [formData, setFormData] = useState({
        title: ''
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit?.(formData);
    };` : ''}`,
        list: `${useHooks ? `const [items, setItems] = useState([
        { id: 1, text: '項目 1' },
        { id: 2, text: '項目 2' }
    ]);

    const onSelectItem = (item) => {
        onSelect?.(item);
    };` : ''}`,
        default: `${useHooks ? `const [count, setCount] = useState(0);

    useEffect(() => {
        console.log('Component mounted');
        
        return () => {
            console.log('Component unmounted');
        };
    }, []);` : ''}`
    };

    // PropTypes 配置
    const propTypes = {
        form: `${componentName}.propTypes = {
    onSubmit: PropTypes.func,
    initialData: PropTypes.shape({
        title: PropTypes.string
    })
};`,
        list: `${componentName}.propTypes = {
    items: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.number,
            text: PropTypes.string
        })
    ),
    onSelect: PropTypes.func
};`,
        layout: `${componentName}.propTypes = {
    header: PropTypes.node,
    footer: PropTypes.node,
    children: PropTypes.node
};`,
        default: `${componentName}.propTypes = {
    children: PropTypes.node
};`
    };

    const templateContent = templates[templateType] || templates.basic;
    const logicContent = logics[templateType === 'form' ? 'form' : templateType === 'list' ? 'list' : 'default'];
    const propTypesContent = useProps 
        ? propTypes[templateType === 'form' ? 'form' : templateType === 'list' ? 'list' : templateType === 'layout' ? 'layout' : 'default'] 
        : '';

    // 類別元件處理
    if (!isFunction) {
        const classLogic = templateType === 'form' ? 
            `state = {
        formData: this.props.initialData || { title: "" }
    };

    handleSubmit = (e) => {
        e.preventDefault();
        this.props.onSubmit?.(this.state.formData);
    };

    handleChange = (e) => {
        this.setState({
            formData: {
                ...this.state.formData,
                [e.target.name]: e.target.value
            }
        });
    };` : templateType === 'list' ? 
            `state = {
        items: this.props.items || []
    };

    handleSelectItem = (item) => {
        this.props.onSelect?.(item);
    };` : 
            `state = {
        count: 0
    };`;

        return `import React${useHooks ? ', { Component }' : ''} from 'react';
${useProps ? `import PropTypes from 'prop-types';` : ''}
${useStyles ? `import styles from './${componentName}.module.css';` : ''}

export class ${componentName} extends React.Component {
    ${classLogic}

    componentDidMount() {
        console.log('Component mounted');
    }

    render() {
        return (
            <div${useStyles ? ' className={`${styles.container} ${componentName.toLowerCase()}-container`}' : ''}>
                ${templateContent
                    .replace(/handleSubmit/g, 'this.handleSubmit')
                    .replace(/onSelectItem/g, 'this.handleSelectItem')
                    .replace(/formData/g, 'this.state.formData')
                    .replace(/items/g, 'this.state.items')}
            </div>
        );
    }
}

${propTypesContent}

${componentName}.defaultProps = {
    ${templateType === 'form' ? 'initialData: {}' : templateType === 'list' ? 'items: []' : ''}
};

export default ${componentName};`;
    }

    // 函式元件處理
    return `import React${useHooks ? ', { useState, useEffect }' : ''} from 'react';
${useProps ? `import PropTypes from 'prop-types';` : ''}
${useStyles ? `import styles from './${componentName}.module.css';` : ''}

export const ${componentName} = (${useProps ? '{ children, ...props }' : ''}) => {
    ${logicContent}
    
    return (
        <div${useStyles ? ' className={`${styles.container} ${componentName.toLowerCase()}-container`}' : ''}>
            ${templateContent}
        </div>
    );
}

${propTypesContent}

${componentName}.defaultProps = {
    ${templateType === 'form' ? 'initialData: {}' : templateType === 'list' ? 'items: []' : ''}
};

export default ${componentName};`;
}

function copyToClipboard() {
    const output = document.getElementById('output');
    const textToCopy = output.textContent;
    
    if (!textToCopy.trim()) {
        alert('沒有可複製的內容，請先產生元件代碼！');
        return;
    }

    navigator.clipboard.writeText(textToCopy).then(() => {
        alert('程式碼已複製到剪貼簿！');
    }).catch(err => {
        console.error('複製失敗：', err);
        // 降級方案
        const textarea = document.createElement('textarea');
        textarea.value = textToCopy;
        document.body.appendChild(textarea);
        textarea.select();
        try {
            document.execCommand('copy');
            alert('程式碼已複製到剪貼簿！');
        } catch (e) {
            alert('複製失敗，請手動複製。');
        }
        document.body.removeChild(textarea);
    });
}

function downloadFile() {
    const componentName = document.getElementById('filename').value.trim();
    if (!componentName) {
        alert('請先輸入元件名稱！');
        return;
    }

    const content = document.getElementById('output').textContent;
    if (!content.trim()) {
        alert('沒有可下載的內容，請先產生元件代碼！');
        return;
    }

    const framework = document.getElementById('framework').value;
    const extension = framework === 'vue' ? 'vue' : 'jsx';
    const blob = new Blob([content], { type: 'text/javascript' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${componentName}.${extension}`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}