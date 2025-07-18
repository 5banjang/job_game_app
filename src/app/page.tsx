'use client';

import { useRef, useState } from 'react';

export default function Home() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const files = event.dataTransfer.files;
    if (files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleFileSelect();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-red-400 relative overflow-hidden">
      {/* 재미있는 배경 효과 */}
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 via-purple-600/20 to-pink-600/20"></div>
      <div className="absolute top-10 left-10 w-72 h-72 bg-yellow-300/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl"></div>
      
      {/* 메인 컨텐츠 */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
        {/* 제목 */}
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white text-center mb-4 drop-shadow-2xl">
          <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
            AI가 지배한 세상...
          </span>
        </h1>
        <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white text-center mb-16 drop-shadow-xl">
          나의 대체 직업은?
        </h2>

        {/* 파일 업로드 박스 */}
        <div className="w-full max-w-md">
          <div
            className={`
              relative border-4 border-dashed rounded-2xl p-12 text-center cursor-pointer
              transition-all duration-300 ease-in-out transform hover:scale-105
              ${isDragOver 
                ? 'border-yellow-300 bg-white/20 scale-105' 
                : 'border-white/60 bg-white/10 hover:bg-white/20 hover:border-yellow-300'
              }
              backdrop-blur-sm shadow-2xl
            `}
            onClick={handleFileSelect}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onKeyDown={handleKeyDown}
            tabIndex={0}
            role="button"
            aria-label="사진을 업로드하려면 클릭하거나 드래그하세요"
          >
            {/* 파일 input (숨김) */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
              aria-hidden="true"
            />

            {selectedFile ? (
              <div className="space-y-4">
                <div className="text-6xl">✅</div>
                <div className="text-white font-semibold text-lg">
                  {selectedFile.name}
                </div>
                <div className="text-yellow-200 text-sm">
                  파일이 선택되었습니다!
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 업로드 아이콘 */}
                <div className="text-6xl md:text-7xl">📸</div>
                
                {/* 텍스트 */}
                <div className="space-y-2">
                  <p className="text-white font-semibold text-lg md:text-xl">
                    여기를 클릭해 사진 업로드
                  </p>
                  <p className="text-yellow-200 text-sm md:text-base">
                    또는 파일을 드래그해서 놓으세요
                  </p>
                </div>

                {/* 추가 안내 */}
                <div className="mt-6 text-white/80 text-xs md:text-sm space-y-1">
                  <p>📱 셀카, 증명사진 등 얼굴이 보이는 사진</p>
                  <p>🎯 AI가 당신에게 맞는 미래 직업을 추천해드립니다!</p>
                </div>
              </div>
            )}

            {/* 호버 효과 표시 */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-yellow-400/0 to-orange-400/0 hover:from-yellow-400/10 hover:to-orange-400/10 transition-all duration-300"></div>
          </div>

          {/* 분석 버튼 (파일이 선택되었을 때만 표시) */}
          {selectedFile && (
            <button className="w-full mt-8 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold py-4 px-8 rounded-xl text-lg hover:from-yellow-500 hover:to-orange-600 transform hover:scale-105 transition-all duration-300 shadow-2xl">
              🔮 AI 분석 시작하기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
