'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

interface GenerateResponse {
  success: boolean;
  message: string;
  imageData: string;
  jobText: string;
  prompt: string;
  error?: string;
}

export default function Home() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jobText, setJobText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setGeneratedImage(null); // 새 파일 선택 시 이전 결과 초기화
      setErrorMessage(null);
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
      setGeneratedImage(null);
      setErrorMessage(null);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleFileSelect();
    }
  };

  const handleGenerateImage = async () => {
    if (!selectedFile || !jobText.trim()) {
      setErrorMessage('이미지와 직업을 모두 입력해주세요.');
      return;
    }

    // 고유 ID 생성 (현재 시간 + 랜덤값)
    const generationId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // 파일을 Base64로 변환
      const fileBase64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(selectedFile);
      });

      // 로컬 스토리지에 생성 요청 데이터 저장
      const generationData = {
        id: generationId,
        jobText: jobText.trim(),
        imageFile: fileBase64,
        fileName: selectedFile.name,
        timestamp: Date.now(),
        status: 'pending'
      };

      localStorage.setItem(`generation_${generationId}`, JSON.stringify(generationData));

      // 결과 페이지로 이동
      router.push(`/result/${generationId}`);

    } catch (error) {
      console.error('Generation preparation error:', error);
      setErrorMessage('이미지 처리 중 오류가 발생했습니다.');
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setJobText('');
    setGeneratedImage(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
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

        <div className="w-full max-w-2xl space-y-8">
          {/* 결과 이미지가 있으면 표시 */}
          {generatedImage && (
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-2xl">
              <h3 className="text-white font-bold text-xl mb-4 text-center">
                🎉 당신의 새로운 직업: {jobText}
              </h3>
              <div className="relative rounded-xl overflow-hidden">
                <img
                  src={`data:image/png;base64,${generatedImage}`}
                  alt={`${jobText}로 일하는 모습`}
                  className="w-full h-auto max-h-96 object-cover"
                />
              </div>
              <button
                onClick={handleReset}
                className="w-full mt-4 bg-gradient-to-r from-green-400 to-blue-500 text-white font-bold py-3 px-6 rounded-xl hover:from-green-500 hover:to-blue-600 transition-all duration-300"
              >
                🔄 다시 시도하기
              </button>
            </div>
          )}

          {/* 입력 영역 */}
          {!generatedImage && (
            <>
              {/* 파일 업로드 박스 */}
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

              {/* 직업 입력 필드 */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-2xl">
                <label htmlFor="jobText" className="block text-white font-semibold text-lg mb-3">
                  💼 원하는 직업을 입력하세요
                </label>
                <input
                  id="jobText"
                  type="text"
                  value={jobText}
                  onChange={(e) => setJobText(e.target.value)}
                  placeholder="예: 고양이 수염 염색 전문가, 우주 카페 바리스타, 드론 택배 조종사..."
                  className="w-full px-4 py-3 rounded-xl bg-white/20 text-white placeholder-white/70 border-2 border-white/30 focus:border-yellow-300 focus:outline-none transition-all duration-300"
                  disabled={isGenerating}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && selectedFile && jobText.trim()) {
                      handleGenerateImage();
                    }
                  }}
                />
                <p className="text-yellow-200 text-sm mt-2">
                  💡 창의적이고 재미있는 직업일수록 더 흥미로운 결과가 나와요!
                </p>
              </div>

              {/* 에러 메시지 */}
              {errorMessage && (
                <div className="bg-red-500/20 backdrop-blur-sm rounded-xl p-4 border-2 border-red-400">
                  <p className="text-red-200 text-center font-semibold">
                    ⚠️ {errorMessage}
                  </p>
                </div>
              )}

              {/* 생성 버튼 */}
              {selectedFile && jobText.trim() && (
                <button
                  onClick={handleGenerateImage}
                  disabled={isGenerating}
                  className={`
                    w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold py-4 px-8 rounded-xl text-lg
                    transform transition-all duration-300 shadow-2xl
                    ${isGenerating 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:from-yellow-500 hover:to-orange-600 hover:scale-105'
                    }
                  `}
                >
                  {isGenerating ? (
                    <span className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                      <span>🎨 AI가 이미지를 생성하고 있어요...</span>
                    </span>
                  ) : (
                    '🔮 AI 분석 시작하기'
                  )}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
