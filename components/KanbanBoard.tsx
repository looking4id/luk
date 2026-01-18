
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { MOCK_COLUMNS, MOCK_USERS, MOCK_PROJECTS } from '../constants';
import { KanbanCard } from './KanbanCard';
import { 
  Circle, CheckCircle2, MoreHorizontal, Plus, XCircle, Clock, Trash2, 
  ChevronDown, Paperclip, Download, UploadCloud, FileText, ChevronRight, 
  LayoutList, FolderTree, PlayCircle, ShieldAlert, Zap, User, Target, Calendar,
  Maximize2, Bold, Italic, Underline, Link, Box, ListChecks, History, Share2, 
  Settings, Ban, Edit3, Search, Repeat, MessageSquare
} from './Icons';
import { Task, TaskType, Priority, Severity, FilterState, Attachment, ViewType, Column, User as UserType } from '../types';
import { StatusBadge, PriorityBadge, SeverityBadge } from './ProjectShared';

// 还原原型图的高保真编辑器工具栏
const EditorToolbar = () => (
    <div className="flex items-center gap-4 py-2 border-b border-slate-100 bg-slate-50/50 px-4 flex-wrap">
        <div className="flex items-center gap-1 pr-4 border-r border-slate-200">
            <button type="button" className="p-1.5 hover:bg-white rounded-none text-slate-500 transition-colors"><History size={14}/></button>
            <button type="button" className="p-1.5 hover:bg-white rounded-none text-slate-500 rotate-180 transition-colors"><History size={14}/></button>
            <button type="button" className="p-1.5 hover:bg-white rounded-none text-slate-500 transition-colors"><Box size={14}/></button>
            <button type="button" className="p-1.5 hover:bg-white rounded-none text-slate-500 transition-colors"><Target size={14}/></button>
            <button type="button" className="flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-slate-600 hover:bg-white rounded-none border border-transparent hover:border-slate-200 ml-2 transition-all">
                <Plus size={12}/> 插入
            </button>
        </div>
        <div className="flex items-center gap-3 pr-4 border-r border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 cursor-pointer hover:text-blue-600 flex items-center gap-1">正文 <ChevronDown size={10}/></span>
            <span className="text-[11px] font-bold text-slate-500 cursor-pointer hover:text-blue-600 flex items-center gap-1">微软雅黑 <ChevronDown size={10}/></span>
            <span className="text-[11px] font-bold text-slate-500 cursor-pointer hover:text-blue-600 flex items-center gap-1">14px <ChevronDown size={10}/></span>
        </div>
        <div className="flex items-center gap-1">
            <button type="button" className="p-1.5 hover:bg-white rounded-none text-slate-500 transition-colors"><Bold size={14}/></button>
            <button type="button" className="p-1.5 hover:bg-white rounded-none text-slate-500 transition-colors"><Italic size={14}/></button>
            <button type="button" className="p-1.5 hover:bg-white rounded-none text-slate-500 transition-colors"><Underline size={14}/></button>
            <button type="button" className="p-1.5 hover:bg-white rounded-none text-slate-500 transition-colors"><Ban size={14} className="rotate-45"/></button>
        </div>
        <div className="ml-auto flex items-center gap-2">
             <button type="button" className="p-1.5 hover:bg-white rounded-none text-slate-400 transition-colors"><Maximize2 size={14}/></button>
        </div>
    </div>
);

// 辅助属性字段组件 (还原图2右侧样式)
const SidePropertyField = ({ label, required, children }: any) => (
    <div className="space-y-1.5">
        <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
    </div>
);

// 还原图1 & 图2：高保真新建工作项弹窗
export const CreateTaskModal: React.FC<{
    onClose: () => void;
    onSubmit: (task: Task) => void;
    defaultType: TaskType | null;
    defaultProjectId?: string;
}> = ({ onClose, onSubmit, defaultType, defaultProjectId }) => {
    const [title, setTitle] = useState('');
    const [type, setType] = useState<TaskType>(defaultType || TaskType.Task);
    const [priority, setPriority] = useState<Priority>(Priority.Normal);
    const [severity, setSeverity] = useState<Severity>(Severity.Normal);
    const [assigneeId, setAssigneeId] = useState('u1');

    const isDefect = type === TaskType.Defect;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 font-sans">
            <div className={`bg-white rounded-none shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300 border border-white/20 ${isDefect ? 'w-[1150px] h-[88vh]' : 'w-[880px]'}`}>
                {/* 头部导航 */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white flex-shrink-0">
                    <h3 className="text-base font-black text-slate-800 tracking-tight">创建{type}</h3>
                    <div className="flex items-center gap-4">
                        <button className="text-xs text-slate-400 font-bold hover:text-slate-600 flex items-center gap-1 transition-colors">更多 <ChevronDown size={12}/></button>
                        <button onClick={onClose} className="p-1 text-slate-300 hover:text-slate-600 transition-colors"><XCircle size={22} /></button>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden flex">
                    {/* 左侧编辑器主体 */}
                    <div className="flex-1 flex flex-col overflow-y-auto custom-scrollbar p-8">
                        {/* 顶部元数据面包屑 (还原图1图标样式) */}
                        <div className="flex items-center gap-8 mb-8 py-2.5 px-6 bg-slate-50/80 rounded-none border border-slate-100 text-[11px] font-black text-slate-400">
                             <div className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors"><Box size={14} className="text-slate-300"/> 空间: <span className="text-slate-700 flex items-center gap-1 font-black">CICD <ChevronDown size={10}/></span></div>
                             <div className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors"><LayoutList size={14} className="text-slate-300"/> 类别: <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1 font-black leading-none">{type} <ChevronDown size={10}/></span></div>
                             <div className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors"><Zap size={14} className="text-slate-300"/> 模板: <span className="text-slate-700 flex items-center gap-1 font-black">金融缺陷模板 <ChevronDown size={10}/></span></div>
                        </div>

                        {/* 大字号无边框标题 (还原图2红线下划线) */}
                        <div className="mb-6 relative">
                            <input 
                                required autoFocus
                                placeholder="请输入标题"
                                className="w-full text-2xl font-black text-slate-800 placeholder:text-slate-200 outline-none pb-4 transition-all bg-transparent" 
                                value={title} onChange={e => setTitle(e.target.value)}
                            />
                            <div className="absolute bottom-2 left-0 right-0 h-0.5 bg-red-500/20"></div>
                        </div>

                        {/* 编辑器内容区 */}
                        <div className="border border-slate-200 rounded-none overflow-hidden flex-1 flex flex-col min-h-[420px] shadow-sm bg-white">
                            <EditorToolbar />
                            <div className="p-10 text-sm text-slate-600 flex-1 overflow-auto leading-relaxed custom-scrollbar">
                                {isDefect ? (
                                    <div className="space-y-10">
                                        <p className="text-red-500 font-black text-base">问题描述:</p>
                                        <div className="h-24"></div>
                                        <p className="text-red-500 font-black text-base">重现场景&步骤:</p>
                                        <p className="text-slate-400 font-bold">操作步骤&截图:</p>
                                        <div className="h-24"></div>
                                        <div className="p-6 bg-blue-50/50 rounded-none border border-blue-100/50 shadow-inner">
                                            <p className="text-red-500 font-black mb-2 flex items-center gap-2"><Target size={16}/> 问题信息:</p>
                                            <p className="text-slate-500 font-medium leading-loose">
                                                • 链接: <br/>
                                                • 出现时间: <br/>
                                                • 影响范围 (个人/多人，个别数据/非个别数据): <br/>
                                                • 其他:
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-8">
                                        <p className="font-black text-slate-800 text-xl tracking-tight">需求背景</p>
                                        <p className="font-black text-slate-800 text-lg">【用户故事 (User Story)】</p>
                                        <p><span className="text-red-600 font-black">作为</span> ...</p>
                                        <p><span className="text-red-600 font-black">我希望</span> ...</p>
                                        <p><span className="text-red-600 font-black">以便</span> ...</p>
                                        <div className="h-12"></div>
                                        <p className="font-black text-slate-800 text-lg">【验收标准】</p>
                                        <div className="flex items-start gap-4">
                                            <div className="w-5 h-5 border-2 border-slate-200 rounded mt-1 bg-white"></div>
                                            <span className="text-slate-400 font-bold mt-1 tracking-tight">在这里定义详细的测试验收准则...</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 右侧属性边栏 (还原图2 & 图6 风格) */}
                    {isDefect && (
                        <div className="w-88 border-l border-slate-100 bg-slate-50/40 p-8 overflow-y-auto custom-scrollbar space-y-8 flex-shrink-0">
                            <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-4">基础属性维护</h4>
                            
                            <SidePropertyField label="关联需求" required>
                                <div className="relative">
                                    <input placeholder="搜索 ID/标题..." className="w-full bg-white border border-slate-200 rounded-none px-4 py-2.5 text-xs outline-none focus:border-blue-500 shadow-sm transition-all" />
                                    <Search size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300" />
                                </div>
                            </SidePropertyField>

                            <SidePropertyField label="发现版本" required>
                                <select className="w-full bg-white border border-slate-200 rounded-none px-3 py-2.5 text-xs outline-none shadow-sm cursor-pointer hover:bg-slate-50 transition-colors font-bold text-slate-700"><option>请选择版本...</option></select>
                            </SidePropertyField>

                            <SidePropertyField label="缺陷所属模块">
                                <select className="w-full bg-white border border-slate-200 rounded-none px-3 py-2.5 text-xs outline-none shadow-sm cursor-pointer hover:bg-slate-50 transition-colors font-bold text-slate-700"><option>-</option></select>
                            </SidePropertyField>

                            <SidePropertyField label="优先级">
                                <select className="w-full bg-white border border-slate-200 rounded-none px-3 py-2.5 text-xs outline-none shadow-sm font-black text-slate-700 transition-colors" value={priority} onChange={e => setPriority(e.target.value as Priority)}>
                                    {Object.values(Priority).map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </SidePropertyField>

                            <SidePropertyField label="严重程度">
                                <select className="w-full bg-white border border-slate-200 rounded-none px-3 py-2.5 text-xs outline-none shadow-sm font-black text-slate-700 transition-colors" value={severity} onChange={e => setSeverity(e.target.value as Severity)}>
                                    {Object.values(Severity).map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </SidePropertyField>

                            <SidePropertyField label="处理负责人">
                                <select className="w-full bg-white border border-slate-200 rounded-none px-3 py-2.5 text-xs outline-none shadow-sm font-bold text-slate-700 transition-colors" value={assigneeId} onChange={e => setAssigneeId(e.target.value)}>
                                    {MOCK_USERS.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </SidePropertyField>

                            <button className="text-[11px] font-black text-slate-400 hover:text-blue-500 flex items-center gap-1.5 pt-2 uppercase tracking-widest transition-colors"><Plus size={14} strokeWidth={3}/> 添加自定义字段</button>
                            
                            <div className="pt-8 border-t border-slate-100 space-y-6">
                                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">关联对象与附件</h4>
                                <div className="flex items-center justify-between text-xs text-slate-500 bg-white p-4 rounded-none border border-slate-100 shadow-sm group hover:border-blue-200 transition-all cursor-pointer">
                                    <div className="flex items-center gap-3"><Paperclip size={16} className="text-slate-300 group-hover:text-blue-500 transition-colors"/> 附件附件</div> 
                                    <button className="text-blue-600 font-black flex items-center gap-1 bg-blue-50 px-2 py-1 rounded-none"><Plus size={14} strokeWidth={3}/> 添加</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 底部按钮组合 (还原原型图布局) */}
                <div className="px-10 py-5 border-t border-slate-100 bg-white flex items-center justify-between flex-shrink-0 z-30 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
                    <label className="flex items-center gap-3 cursor-pointer group">
                        <input type="checkbox" defaultChecked className="w-5 h-5 rounded-none border-slate-300 text-blue-600 focus:ring-blue-500 transition-all" />
                        <span className="text-xs font-black text-slate-400 group-hover:text-slate-600 transition-colors uppercase tracking-widest">只展示必填字段 (Required Only)</span>
                    </label>
                    <div className="flex gap-4">
                        <button type="submit" onClick={() => onSubmit({} as any)} className="px-12 py-3 bg-blue-600 text-white rounded-none text-sm font-black hover:bg-blue-700 shadow-xl shadow-blue-200 transition-all active:scale-95 uppercase tracking-widest">创建</button>
                        <button type="button" className="px-8 py-3 bg-white border border-slate-200 text-slate-700 rounded-none text-sm font-black hover:bg-slate-50 transition-all uppercase tracking-widest">提交并继续创建</button>
                        {!isDefect && <button type="button" className="px-8 py-3 bg-white border border-slate-200 text-slate-600 rounded-none text-sm font-black hover:bg-slate-50 transition-all uppercase tracking-widest">保存草稿</button>}
                        <button onClick={onClose} type="button" className="px-8 py-3 bg-white border border-slate-200 text-slate-400 rounded-none text-sm font-black hover:bg-slate-50 transition-all uppercase tracking-widest">取消</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 还原图5 & 图6：侧滑详情页视图
export const TaskDetailsModal: React.FC<{
    task: Task;
    onClose: () => void;
    onUpdate: (task: Task) => void;
    onDelete: (id: string) => void;
}> = ({ task, onClose, onUpdate, onDelete }) => {
    const [activeTab, setActiveTab] = useState('详细信息');

    return (
        <div className="fixed inset-0 bg-slate-900/10 backdrop-blur-[1.5px] z-[120] flex items-center justify-end font-sans">
            <div className="fixed inset-0 cursor-default" onClick={onClose}></div>
            <div className="bg-white w-[1120px] h-full shadow-[-30px_0_70px_rgba(0,0,0,0.12)] flex flex-col animate-in slide-in-from-right duration-500 relative z-10 border-l border-slate-100">
                {/* 顶部标题栏 (还原图5) */}
                <div className="px-10 py-5 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-30 shadow-sm">
                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 px-4 py-2 rounded-none text-emerald-600 font-black text-xs hover:bg-emerald-100 transition-all cursor-pointer group shadow-sm">
                             规划中 <ChevronDown size={14} className="group-hover:translate-y-0.5 transition-transform" strokeWidth={3} />
                        </div>
                        <div className="flex items-center gap-2 border-l border-slate-100 pl-6 ml-2">
                            <span className="text-slate-300 font-mono font-black text-sm tracking-tight">ITEM_ID: {task.id.replace('t', '1000')}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                            <button className="p-2.5 text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-white rounded-none transition-all shadow-sm group border border-transparent hover:border-slate-100"><Maximize2 size={18}/></button>
                            <button className="p-2.5 text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-white rounded-none transition-all shadow-sm group border border-transparent hover:border-slate-100"><ChevronDown size={18}/></button>
                            <button className="p-2.5 text-slate-400 hover:text-blue-600 bg-slate-50 hover:bg-white rounded-none transition-all shadow-sm group border border-transparent hover:border-slate-100"><Edit3 size={18}/></button>
                            <button className="p-2.5 text-slate-400 hover:text-red-500 bg-slate-50 hover:bg-white rounded-none transition-all shadow-sm group border border-transparent hover:border-slate-100" onClick={() => onDelete(task.id)}><Trash2 size={18}/></button>
                        </div>
                        <div className="w-px h-8 bg-slate-100 mx-2"></div>
                        <button onClick={onClose} className="p-2.5 text-slate-300 hover:text-slate-800 transition-colors"><XCircle size={28} /></button>
                    </div>
                </div>

                <div className="flex-1 overflow-hidden flex bg-white">
                    {/* 左侧核心内容区 (还原图5 & 6 左侧布局) */}
                    <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar border-r border-slate-50">
                        <div className="px-12 py-10">
                            <div className="flex items-start gap-5 mb-10">
                                <span className={`mt-2 px-2.5 py-1 rounded text-[10px] font-black text-white flex-shrink-0 shadow-md ${task.type === TaskType.Defect ? 'bg-red-500' : 'bg-blue-600 uppercase'}`}>{task.type === TaskType.Requirement ? 'STORY' : task.type === TaskType.Defect ? 'BUG' : 'TASK'}</span>
                                <div className="flex-1">
                                    <h2 className="text-3xl font-black text-slate-800 tracking-tight leading-snug mb-5 group relative">
                                        {task.title}
                                        <button className="absolute -right-10 top-1 p-2 text-slate-200 opacity-0 group-hover:opacity-100 transition-all hover:text-blue-500"><Edit3 size={20}/></button>
                                    </h2>
                                    <div className="flex items-center gap-4">
                                        <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-500 hover:text-blue-600 rounded-none transition-all font-black text-[11px] border border-transparent hover:border-blue-100 shadow-sm"><User size={16}/> 分配负责人</button>
                                        <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-500 hover:text-amber-500 rounded-none transition-all font-black text-[11px] border border-transparent hover:border-amber-100 shadow-sm"><Target size={16}/> 设置目标</button>
                                        <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-500 hover:text-blue-500 rounded-none transition-all font-black text-[11px] border border-transparent hover:border-blue-100 shadow-sm"><Link size={16}/> 关联对象</button>
                                    </div>
                                </div>
                            </div>

                            {/* 高保真页签导航 (还原图5) */}
                            <div className="flex items-center gap-12 border-b border-slate-100 mb-12 overflow-x-auto no-scrollbar whitespace-nowrap scroll-smooth">
                                {['详细信息', '子需求(0)', '缺陷(0)', '花费(0)', '变更历史(2)', '关联项目(0)', '云原生构建(0)', '更多'].map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={`pb-4 text-sm font-black transition-all relative ${
                                            activeTab === tab ? 'text-blue-600 scale-105' : 'text-slate-400 hover:text-slate-600'
                                        }`}
                                    >
                                        {tab}
                                        {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600 rounded-none shadow-[0_2px_8px_rgba(37,99,235,0.4)]"></div>}
                                    </button>
                                ))}
                                <button className="p-2.5 text-slate-300 hover:text-blue-600 ml-auto transition-colors"><Settings size={16} strokeWidth={3}/></button>
                            </div>

                            {/* 描述与编辑器区域 (还原图5中间空白状态) */}
                            <div className="space-y-16 pb-32">
                                <div className="bg-slate-50/50 rounded-none p-16 border-2 border-dashed border-slate-200 text-center group cursor-pointer hover:bg-blue-50/30 hover:border-blue-200 transition-all shadow-inner">
                                     <div className="text-slate-300 flex flex-col items-center gap-6">
                                         <Edit3 size={48} className="opacity-15 group-hover:scale-110 group-hover:opacity-40 transition-all duration-500" strokeWidth={1} />
                                         <div className="space-y-1">
                                            <span className="text-base font-black text-slate-400">暂无详细描述</span>
                                            <p className="text-xs text-slate-300 font-bold uppercase tracking-widest">Click to enter description</p>
                                         </div>
                                     </div>
                                </div>

                                {/* 底部扩展区块 (还原图5样式) */}
                                <div className="space-y-10">
                                    <DetailFieldRow label="项目标签" hasWarning={task.type === TaskType.Defect} count={task.type === TaskType.Defect ? 1 : 0} />
                                    <DetailFieldRow label="关联附件" count={0} />
                                    <DetailFieldRow label="项目评论" count={0} />
                                </div>

                                {/* 工作流药丸按钮 (还原图5底部工作流样式) */}
                                <div className="space-y-8 pt-6 border-t border-slate-50">
                                    <div className="flex items-center justify-between">
                                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-[0.2em] flex items-center gap-2">
                                            <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                                            工作流阶段流转
                                        </h4>
                                        <button className="text-[11px] text-slate-400 font-black hover:text-blue-600 flex items-center gap-1.5 uppercase tracking-widest transition-colors"><History size={14}/> 查看全量流转图谱</button>
                                    </div>
                                    <div className="flex items-center gap-3 flex-wrap bg-slate-50/50 p-6 rounded-none border border-slate-100">
                                        <button className="px-8 py-2.5 rounded-none bg-blue-600 text-white border border-blue-700 text-xs font-black shadow-lg shadow-blue-200 ring-4 ring-white transition-transform active:scale-95">规划中 (当前阶段)</button>
                                        <div className="w-8 h-px bg-slate-200"></div>
                                        <button className="px-8 py-2.5 rounded-none bg-white text-slate-600 border border-slate-200 text-xs font-black hover:bg-slate-50 transition-all hover:border-blue-400 hover:text-blue-500 hover:shadow-md active:scale-95">进入开发阶段</button>
                                        <div className="w-8 h-px bg-slate-200"></div>
                                        <button className="px-8 py-2.5 rounded-none bg-white text-slate-600 border border-slate-200 text-xs font-black hover:bg-slate-50 transition-all hover:border-red-400 hover:text-red-500 hover:shadow-md active:scale-95">已拒绝此项</button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 固定底部的评论输入 (还原图5底部) */}
                        <div className="sticky bottom-0 bg-white border-t border-slate-100 px-12 py-6 z-20 shadow-[0_-15px_40px_rgba(0,0,0,0.03)]">
                            <div className="flex gap-6 items-start">
                                <div className={`w-12 h-12 rounded-full ${task.assignee.avatarColor} text-white flex items-center justify-center font-black shadow-lg flex-shrink-0 scale-95`}>{task.assignee.name.charAt(0)}</div>
                                <div className="flex-1 relative group">
                                    <input placeholder="输入评论内容，使用 @ 通知成员，Ctrl + Enter 提交" className="w-full bg-slate-50 border border-slate-100 rounded-none px-6 py-3.5 text-sm outline-none focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all shadow-inner" />
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 opacity-0 group-focus-within:opacity-100 transition-opacity">
                                        <button className="p-2 text-slate-400 hover:text-blue-500"><MessageSquare size={16}/></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 右侧基础信息栏 (还原图5 & 6) */}
                    <div className="w-[360px] bg-white p-12 overflow-y-auto no-scrollbar space-y-12 flex-shrink-0 shadow-[-10px_0_30px_rgba(0,0,0,0.01)]">
                        <h4 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                            基础属性信息
                        </h4>
                        
                        <div className="space-y-10">
                            <InfoPropertyRow icon={Target} label="当前事项状态"><StatusBadge status="规划中" className="scale-110 origin-left shadow-sm py-1.5 px-3 rounded-none"/></InfoPropertyRow>
                            <InfoPropertyRow icon={Share2} label="上级父需求项"><span className="text-blue-600 font-black text-sm hover:underline underline-offset-4 cursor-pointer">【示例】个人中心重构项目 V2.0</span></InfoPropertyRow>
                            <InfoPropertyRow icon={Zap} label="项目应用模板"><span className="text-slate-600 font-bold text-sm bg-slate-50 px-2 py-1 rounded-none">金融需求默认模板</span></InfoPropertyRow>
                            <InfoPropertyRow icon={Box} label="功能模块分类"><span className="text-slate-400 font-bold text-sm italic">未分配具体分类</span></InfoPropertyRow>
                            <InfoPropertyRow icon={Repeat} label="关联迭代计划"><span className="text-slate-400 font-black text-sm uppercase tracking-tighter">Not Assigned</span></InfoPropertyRow>
                            <InfoPropertyRow icon={Zap} label="业务优先级"><PriorityBadge priority={task.priority}/></InfoPropertyRow>
                            {task.type === TaskType.Defect && <InfoPropertyRow icon={ShieldAlert} label="致命严重程度"><SeverityBadge severity={task.severity}/></InfoPropertyRow>}
                            <InfoPropertyRow icon={User} label="处理负责人"><span className="text-slate-800 font-black text-sm flex items-center gap-2"><div className={`w-5 h-5 rounded-full ${task.assignee.avatarColor} text-[8px] text-white flex items-center justify-center`}>{task.assignee.name.charAt(0)}</div> {task.assignee.name}</span></InfoPropertyRow>
                            <InfoPropertyRow icon={Calendar} label="预计开始时间"><span className="text-slate-500 font-mono text-sm tracking-tight font-black">2026-01-01</span></InfoPropertyRow>
                            <InfoPropertyRow icon={Calendar} label="预计发布日期"><span className="text-slate-500 font-mono text-sm tracking-tight font-black">2026-01-15</span></InfoPropertyRow>
                            <InfoPropertyRow icon={User} label="发起创建人"><span className="text-slate-600 font-bold text-sm">TAPD System Core</span></InfoPropertyRow>
                            <InfoPropertyRow icon={Clock} label="创建记录时间"><span className="text-slate-400 font-mono text-xs font-black uppercase tracking-tight">2026.01.01 14:01</span></InfoPropertyRow>
                            <InfoPropertyRow icon={ListChecks} label="预估工作总量"><span className="text-slate-800 font-black text-base">5 <span className="text-xs text-slate-400 ml-1">人天 (Man-Day)</span></span></InfoPropertyRow>
                            <InfoPropertyRow icon={Zap} label="整体交付进度">
                                <div className="flex items-center gap-4 w-full pt-2">
                                    <div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden shadow-inner ring-1 ring-slate-100">
                                        <div className="h-full bg-blue-500 rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(59,130,246,0.6)]" style={{ width: `${task.progress || 0}%` }}></div>
                                    </div>
                                    <span className="text-xs font-black text-slate-800 tabular-nums">{task.progress || 0}%</span>
                                </div>
                            </InfoPropertyRow>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// 详情页左右结构行组件
const DetailFieldRow = ({ label, hasWarning, count }: { label: string, hasWarning?: boolean, count?: number }) => (
    <div className="flex items-center gap-6 border-b border-slate-50 pb-6 group">
        <div className="min-w-[100px] flex items-center gap-2">
            <span className="text-sm font-black text-slate-800 uppercase tracking-[0.15em]">{label}</span>
            {count !== undefined && <span className="text-[10px] font-black text-slate-300">({count})</span>}
        </div>
        <button className="p-2 text-slate-300 hover:text-blue-600 border border-transparent hover:border-blue-100 hover:bg-blue-50/40 rounded-none transition-all shadow-sm group-hover:scale-110 active:scale-95"><Plus size={20} strokeWidth={3}/></button>
        {hasWarning && <span className="bg-red-50 text-red-600 px-4 py-1.5 rounded-none text-[10px] font-black border border-red-100 ml-6 animate-pulse uppercase tracking-widest shadow-sm">Risk Identified</span>}
    </div>
);

// 信息栏属性对行组件
const InfoPropertyRow = ({ icon: Icon, label, children }: { icon: any, label: string, children?: React.ReactNode }) => (
    <div className="flex items-start gap-5 group">
        <div className="pt-1.5 text-slate-300 group-hover:text-blue-500 transition-colors"><Icon size={18} strokeWidth={2.5} /></div>
        <div className="flex-1">
            <span className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 group-hover:text-slate-500 transition-colors">{label}</span>
            <div className="flex flex-wrap items-center">{children}</div>
        </div>
    </div>
);

// 看板核心逻辑
interface KanbanBoardProps {
    filters: FilterState;
    viewType: ViewType;
    isCreateModalOpen: boolean;
    setIsCreateModalOpen: (open: boolean) => void;
    createModalType: TaskType | null;
    setCreateModalType: (type: TaskType | null) => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
    filters, viewType, isCreateModalOpen, setIsCreateModalOpen, createModalType, setCreateModalType 
}) => {
    const [columns, setColumns] = useState<Column[]>(MOCK_COLUMNS);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    const onDragEnd = (result: DropResult) => {
        if (!result.destination) return;
        const { source, destination } = result;

        if (source.droppableId !== destination.droppableId) {
            const sourceColIndex = columns.findIndex(c => c.id === source.droppableId);
            const destColIndex = columns.findIndex(c => c.id === destination.droppableId);
            const sourceCol = columns[sourceColIndex];
            const destCol = columns[destColIndex];
            const sourceTasks = [...sourceCol.tasks];
            const destTasks = [...destCol.tasks];
            const [removed] = sourceTasks.splice(source.index, 1);
            destTasks.splice(destination.index, 0, removed);

            const newColumns = [...columns];
            newColumns[sourceColIndex] = { ...sourceCol, tasks: sourceTasks, count: sourceTasks.length };
            newColumns[destColIndex] = { ...destCol, tasks: destTasks, count: destTasks.length };
            setColumns(newColumns);
        } else {
            const colIndex = columns.findIndex(c => c.id === source.droppableId);
            const column = columns[colIndex];
            const copiedTasks = [...column.tasks];
            const [removed] = copiedTasks.splice(source.index, 1);
            copiedTasks.splice(destination.index, 0, removed);
            const newColumns = [...columns];
            newColumns[colIndex] = { ...column, tasks: copiedTasks };
            setColumns(newColumns);
        }
    };

    const filteredColumns = useMemo(() => {
        return columns.map(col => ({
            ...col,
            tasks: col.tasks.filter(task => {
                const matchesSearch = !filters.search || 
                    task.title.toLowerCase().includes(filters.search.toLowerCase()) ||
                    task.displayId.toLowerCase().includes(filters.search.toLowerCase());
                const matchesAssignee = !filters.assigneeId || task.assignee?.id === filters.assigneeId;
                const matchesType = !filters.type || task.type === filters.type;
                const matchesPriority = !filters.priority || task.priority === filters.priority;
                const matchesProject = !filters.projectId || task.projectId === filters.projectId;
                const matchesStatus = !filters.status || col.title === filters.status;
                return matchesSearch && matchesAssignee && matchesType && matchesPriority && matchesProject && matchesStatus;
            })
        }));
    }, [columns, filters]);

    const handleCreateTask = (task: Task) => {
        // Mock Implementation
        const todoIndex = columns.findIndex(c => c.id === 'todo');
        const newColumns = [...columns];
        const newTask: Task = {
            ...task,
            id: `t${Date.now()}`,
            displayId: `#NEW-${Math.floor(Math.random()*1000)}`,
            statusColor: 'bg-gray-400',
            creatorId: 'u1'
        };
        newColumns[todoIndex] = {
            ...newColumns[todoIndex],
            tasks: [newTask, ...newColumns[todoIndex].tasks],
            count: newColumns[todoIndex].tasks.length + 1
        };
        setColumns(newColumns);
        setIsCreateModalOpen(false);
    };

    const handleUpdateTask = (updatedTask: Task) => {
        const newColumns = columns.map(col => ({
            ...col,
            tasks: col.tasks.map(t => t.id === updatedTask.id ? updatedTask : t)
        }));
        setColumns(newColumns);
    };

    const handleDeleteTask = (taskId: string) => {
        if (window.confirm("确定要永久删除该事项吗？此操作不可恢复。")) {
            const newColumns = columns.map(col => ({
                ...col,
                tasks: col.tasks.filter(t => t.id !== taskId),
                count: col.tasks.filter(t => t.id !== taskId).length
            }));
            setColumns(newColumns);
            setEditingTask(null);
        }
    };

    return (
        <div className="flex-1 overflow-hidden relative">
            <DragDropContext onDragEnd={onDragEnd}>
                <div className="flex h-full p-4 gap-4 overflow-x-auto bg-slate-50/50 kanban-scroll">
                    {filteredColumns.map((column) => (
                        <div key={column.id} className="w-88 flex-shrink-0 flex flex-col h-full bg-slate-100/50 rounded-none border border-slate-200/60 shadow-inner">
                            <div className="p-4 flex items-center justify-between flex-shrink-0">
                                <div className="flex items-center gap-3">
                                    <div className={`w-3 h-3 rounded-full ${column.iconColor.replace('text', 'bg')} shadow-sm shadow-inherit`}></div>
                                    <span className="font-black text-slate-700 text-sm tracking-tight uppercase">{column.title}</span>
                                    <span className="bg-white/80 text-slate-400 text-[10px] px-2 py-0.5 rounded-none font-black border border-slate-100 shadow-sm">{column.tasks.length}</span>
                                </div>
                                <button className="text-slate-300 hover:text-slate-600 transition-colors p-1.5 rounded-none hover:bg-white active:scale-95"><MoreHorizontal size={16} /></button>
                            </div>
                            <Droppable droppableId={column.id}>
                                {(provided) => (
                                    <div {...provided.droppableProps} ref={provided.innerRef} className="flex-1 overflow-y-auto px-3 pb-4 custom-scrollbar min-h-[100px] space-y-3">
                                        {column.tasks.map((task, index) => (
                                            <Draggable key={task.id} draggableId={task.id} index={index}>
                                                {(provided) => (
                                                    <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                                        <KanbanCard task={task} onClick={setEditingTask} onUpdate={handleUpdateTask} />
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                        <button 
                                            onClick={() => { setCreateModalType(TaskType.Task); setIsCreateModalOpen(true); }} 
                                            className="w-full py-4 border-2 border-dashed border-slate-200/60 rounded-none text-slate-400 hover:text-blue-500 hover:border-blue-200 hover:bg-white transition-all flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest group active:scale-[0.98]"
                                        >
                                            <Plus size={18} strokeWidth={3} className="group-hover:scale-110 transition-transform"/> 
                                            <span>快速创建工作项</span>
                                        </button>
                                    </div>
                                )}
                            </Droppable>
                        </div>
                    ))}
                </div>
            </DragDropContext>
            {editingTask && <TaskDetailsModal task={editingTask} onClose={() => setEditingTask(null)} onUpdate={handleUpdateTask} onDelete={handleDeleteTask} />}
            {isCreateModalOpen && <CreateTaskModal defaultType={createModalType} onClose={() => setIsCreateModalOpen(false)} onSubmit={handleCreateTask} />}
        </div>
    );
};