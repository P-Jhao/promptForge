import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useNovel } from '../hooks/useNovels';
import ReadingToolbar from '../components/ReadingToolbar';
import ProgressSlider from '../components/ProgressSlider';
import { createBookmark } from '../services/bookmarkService';

export default function ReadingWorkspace() {
  const { id } = useParams<{ id: string }>();
  const { data: novel, loading } = useNovel(id || '');
  const [fontSize, setFontSize] = useState(16);
  const [theme, setTheme] = useState<'light' | 'dark' | 'sepia'>('light');
  const [currentPage, setCurrentPage] = useState(1);
  const [bookmarkMessage, setBookmarkMessage] = useState('');

  if (loading) {
    return <div className="p-8 text-center text-gray-500">加载中...</div>;
  }

  if (!novel) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500 mb-4">未找到该小说</p>
        <Link to="/novels" className="text-blue-600 hover:underline">返回书架</Link>
      </div>
    );
  }

  const themeStyles: Record<string, string> = {
    light: 'bg-white text-gray-900',
    dark: 'bg-gray-900 text-gray-100',
    sepia: 'bg-amber-50 text-amber-900'
  };

  const handleAddBookmark = () => {
    createBookmark({ novelId: novel.id, pageNumber: currentPage, description: '阅读中标记的页面' });
    setBookmarkMessage('书签已加入当前会话');
  };

  return (
    <div className={'h-full flex flex-col ' + themeStyles[theme]}>
      <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0">
        <Link to={'/novels/' + novel.id} className="p-2 hover:bg-gray-100 rounded-lg">
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <div className="flex-1">
          <h1 className="font-medium text-gray-900">{novel.title}</h1>
          <p className="text-sm text-gray-500">第 {currentPage} 页 / 共 {novel.totalPages} 页</p>
        </div>
        <ReadingToolbar onFontSizeChange={setFontSize} onThemeChange={setTheme} onAddBookmark={handleAddBookmark} />
      </div>
      {bookmarkMessage && <div className="px-4 py-2 text-sm text-green-700 bg-green-50">{bookmarkMessage}</div>}
      <div className="flex-1 overflow-auto">
        <article className="max-w-2xl mx-auto px-6 py-8" style={{ fontSize: fontSize + 'px' }}>
          <p className="mb-5 rounded-lg border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-800">示意正文：此案例用于展示阅读界面交互，不包含完整原书内容。</p>
          <p className="leading-relaxed mb-6">萧炎抬头望着那湛蓝的天空，脸上带着一丝苦笑。三年前，他还是整个萧家最耀眼的天才，斗之力九段，在同龄人中无人能敌。然而，三年后的今天，他却沦为了众人眼中的废物。</p>
          <p className="leading-relaxed mb-6">三十年河东，三十年河西，莫欺少年穷！萧炎默默念叨着，眼中闪过一丝坚定。他不相信，上天会如此对待自己，那神秘戒指中隐藏的秘密，或许就是他翻身的关键。</p>
          <p className="leading-relaxed mb-6">远处传来一阵嘲笑声，几个年轻的萧家子弟正指指点点。为首的萧宁讥讽道：看看我们曾经的天才，现在连我这个八段斗之力都不如，真是可悲。</p>
          <p className="leading-relaxed mb-6">萧炎默默握紧拳头，心中暗自发誓：总有一天，他要让所有人都为今天的轻视付出代价。他转身离开，向着后山走去，那里有他的秘密修炼之地。</p>
        </article>
      </div>
      <div className="flex-shrink-0">
        <ProgressSlider currentPage={currentPage} totalPages={novel.totalPages} onChange={setCurrentPage} />
      </div>
    </div>
  );
}
