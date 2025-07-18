'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface ResultPageProps {
  params: Promise<{ id: string }>;
}

interface GenerationResult {
  success: boolean;
  message: string;
  imageData: string;
  jobText: string;
  prompt: string;
  error?: string;
}

interface GenerationData {
  id: string;
  jobText: string;
  imageFile: string;
  fileName: string;
  timestamp: number;
  status: string;
}

export default function ResultPage({ params }: ResultPageProps) {
  const router = useRouter();
  const [id, setId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('당신의 천직을 찾는 중...');
  const [generationData, setGenerationData] = useState<GenerationData | null>(null);

  // 로딩 메시지 배열
  const loadingMessages = [
    '당신의 천직을 찾는 중...',
    '🔮 AI가 미래를 예측하고 있어요...',
    '🎨 창의적인 직업을 그려내는 중...',
    '⚡ 수천 가지 직업을 분석하고 있어요...',
    '🌟 당신만의 특별한 직업을 만들어내는 중...',
    '🚀 미래 세계로 시간 여행 중...',
    '🎭 당신의 숨겨진 재능을 발견하는 중...',
    '🎪 재미있는 직업 세계를 탐험하는 중...'
  ];

  useEffect(() => {
    // URL 파라미터 추출
    params.then((resolvedParams) => {
      setId(resolvedParams.id);
      
      // 로컬 스토리지에서 생성 데이터 가져오기
      const storedData = localStorage.getItem(`generation_${resolvedParams.id}`);
      if (storedData) {
        try {
          const data: GenerationData = JSON.parse(storedData);
          setGenerationData(data);
          
          // API 호출 시작
          generateImage(data);
        } catch (err) {
          console.error('Error parsing stored data:', err);
          setError('저장된 데이터를 읽을 수 없습니다.');
          setIsLoading(false);
        }
      } else {
        setError('생성 요청 데이터를 찾을 수 없습니다.');
        setIsLoading(false);
      }
    });
  }, [params]);

  useEffect(() => {
    if (!isLoading) return;

    // 로딩 메시지 순환
    const messageInterval = setInterval(() => {
      setLoadingMessage(prev => {
        const currentIndex = loadingMessages.indexOf(prev);
        const nextIndex = (currentIndex + 1) % loadingMessages.length;
        return loadingMessages[nextIndex];
      });
    }, 2000);

    return () => {
      clearInterval(messageInterval);
    };
  }, [isLoading]);

  const generateImage = async (data: GenerationData) => {
    try {
      // Base64 데이터를 File 객체로 변환
      const response = await fetch(data.imageFile);
      const blob = await response.blob();
      const file = new File([blob], data.fileName, { type: blob.type });

      // FormData 생성
      const formData = new FormData();
      formData.append('image', file);
      formData.append('jobText', data.jobText);

      // API 호출
      const apiResponse = await fetch('/api/generate', {
        method: 'POST',
        body: formData,
      });

      const apiResult: GenerationResult = await apiResponse.json();

      if (apiResult.success && apiResult.imageData) {
        setResult(apiResult);
        
        // 성공 데이터를 로컬 스토리지에 저장
        const updatedData = {
          ...data,
          status: 'completed',
          result: apiResult
        };
        localStorage.setItem(`generation_${data.id}`, JSON.stringify(updatedData));
      } else {
        throw new Error(apiResult.error || '이미지 생성에 실패했습니다.');
      }
    } catch (err) {
      console.error('API Error:', err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoHome = () => {
    // 로컬 스토리지 정리
    if (id) {
      localStorage.removeItem(`generation_${id}`);
    }
    router.push('/');
  };

  const handleTryAgain = () => {
    // 로컬 스토리지 정리
    if (id) {
      localStorage.removeItem(`generation_${id}`);
    }
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-red-400 relative overflow-hidden">
        {/* 배경 효과 */}
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 via-purple-600/20 to-pink-600/20"></div>
        <div className="absolute top-20 left-20 w-64 h-64 bg-yellow-300/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-blue-300/30 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-green-300/20 rounded-full blur-2xl animate-pulse delay-500"></div>

        {/* 메인 로딩 컨텐츠 */}
        <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
          {/* 로딩 애니메이션 */}
          <div className="mb-8">
            <div className="relative">
              {/* 중앙 로딩 스피너 */}
              <div className="w-32 h-32 border-8 border-white/30 border-t-yellow-300 rounded-full animate-spin"></div>
              
              {/* 내부 로딩 스피너 */}
              <div className="absolute top-4 left-4 w-24 h-24 border-6 border-transparent border-b-orange-300 rounded-full animate-spin animation-delay-150"></div>
              
              {/* 중앙 아이콘 */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-4xl animate-bounce">
                🔮
              </div>
            </div>
          </div>

          {/* 로딩 메시지 */}
          <div className="text-center space-y-6 max-w-md">
            <h1 className="text-3xl md:text-4xl font-bold text-white drop-shadow-2xl animate-pulse">
              {loadingMessage}
            </h1>
            
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-2xl">
              <p className="text-white/90 text-lg leading-relaxed">
                AI가 당신의 사진을 분석하고<br />
                완벽한 미래 직업을 찾고 있어요
              </p>
              {generationData && (
                <p className="text-yellow-200 text-sm mt-3">
                  분석 중인 직업: {generationData.jobText}
                </p>
              )}
            </div>

            {/* 진행 표시 바 */}
            <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-pulse"></div>
            </div>

            {/* 재미있는 팁들 */}
            <div className="space-y-3 text-white/80 text-sm">
              <p className="animate-fade-in">💡 잠깐만요! 재미있는 사실을 알려드릴게요...</p>
              <p className="animate-fade-in animation-delay-1000">🤖 AI는 1초에 수천 개의 직업을 분석할 수 있어요</p>
              <p className="animate-fade-in animation-delay-2000">🎨 당신만의 독특한 직업이 곧 탄생할 거예요</p>
            </div>
          </div>

          {/* ID 표시 (개발용) */}
          <div className="absolute bottom-4 left-4 text-white/50 text-xs">
            Generation ID: {id}
          </div>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-400 via-pink-400 to-purple-400 flex items-center justify-center px-4">
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 max-w-md text-center shadow-2xl">
          <div className="text-6xl mb-4">😵</div>
          <h1 className="text-2xl font-bold text-white mb-4">앗! 문제가 발생했어요</h1>
          <p className="text-white/90 mb-6">{error}</p>
          <button
            onClick={handleTryAgain}
            className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold py-3 px-6 rounded-xl hover:from-yellow-500 hover:to-orange-600 transition-all duration-300"
          >
            🔄 다시 시도하기
          </button>
        </div>
      </div>
    );
  }

  // 결과 표시
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-red-400 relative overflow-hidden">
      {/* 메인 페이지와 동일한 배경 효과 */}
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 via-purple-600/20 to-pink-600/20"></div>
      <div className="absolute top-10 left-10 w-72 h-72 bg-yellow-300/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      
      {/* 메인 컨텐츠 */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
        <div className="w-full max-w-4xl space-y-8">
          
          {/* 성공 메시지 - 재미있는 스타일 */}
          <div className="text-center space-y-6">
            <div className="space-y-4">
              <div className="text-6xl mb-4 animate-bounce">🎉</div>
              
              {/* 메인 제목 */}
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white drop-shadow-2xl leading-tight">
                <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                  당신의 숨겨진 직업은...
                </span>
              </h1>
              
              {/* 직업명 - 특별한 스타일 */}
              <div className="relative">
                <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-white drop-shadow-2xl transform hover:scale-105 transition-transform duration-300">
                  <span className="bg-gradient-to-r from-emerald-300 via-blue-300 to-purple-300 bg-clip-text text-transparent animate-pulse">
                    {result?.jobText}
                  </span>
                </h2>
                
                {/* 장식 효과 */}
                <div className="absolute -inset-4 bg-gradient-to-r from-yellow-400/20 via-pink-400/20 to-blue-400/20 rounded-3xl blur-xl -z-10"></div>
              </div>
              
              <h3 className="text-2xl md:text-4xl font-bold text-white drop-shadow-xl">
                입니다! ✨
              </h3>
            </div>
          </div>

          {/* 생성된 이미지 - 크게 표시 */}
          {result?.imageData && (
            <div className="relative group">
              {/* 이미지 컨테이너 */}
              <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-4 shadow-2xl transform hover:scale-[1.02] transition-all duration-500">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl">
                  <img
                    src={`data:image/png;base64,${result.imageData}`}
                    alt={`${result.jobText}로 일하는 모습`}
                    className="w-full h-auto max-h-[600px] object-cover"
                  />
                  
                  {/* 이미지 오버레이 효과 */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
                
                {/* 이미지 설명 */}
                <div className="mt-4 text-center">
                  <p className="text-white/90 text-lg font-semibold">
                    🎨 AI가 상상한 당신의 미래 모습
                  </p>
                  <p className="text-white/70 text-sm mt-1">
                    완전히 새로운 당신을 만나보세요!
                  </p>
                </div>
              </div>
              
              {/* 장식적 테두리 효과 */}
              <div className="absolute -inset-2 bg-gradient-to-r from-yellow-400/30 via-pink-400/30 to-blue-400/30 rounded-3xl blur-lg -z-10 group-hover:blur-xl transition-all duration-500"></div>
            </div>
          )}

          {/* 액션 버튼들 */}
          <div className="space-y-4 max-w-md mx-auto">
            <button
              onClick={handleTryAgain}
              className="w-full bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold py-4 px-8 rounded-xl text-lg hover:from-yellow-500 hover:to-orange-600 transform hover:scale-105 transition-all duration-300 shadow-2xl"
            >
              🔄 다른 직업으로 다시 시도
            </button>
            
            <button
              onClick={handleGoHome}
              className="w-full bg-gradient-to-r from-blue-400 to-purple-500 text-white font-bold py-4 px-8 rounded-xl text-lg hover:from-blue-500 hover:to-purple-600 transform hover:scale-105 transition-all duration-300 shadow-2xl"
            >
              🏠 처음으로 돌아가기
            </button>
          </div>

          {/* 재미있는 추가 메시지 */}
          <div className="text-center mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 max-w-md mx-auto">
              <p className="text-white/80 text-sm leading-relaxed">
                💡 <strong>재미있는 사실:</strong><br />
                이 직업은 AI가 당신의 얼굴 특징과 표정을 분석해서<br />
                완전히 새롭게 창조한 미래의 직업입니다!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 