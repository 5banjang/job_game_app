import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // API 키 확인
    const apiKey = process.env.STABILITY_API_KEY;
    if (!apiKey || apiKey === 'your_stability_api_key_here') {
      return NextResponse.json(
        { error: 'Stability AI API key is not configured' },
        { status: 500 }
      );
    }

    // FormData에서 파일과 직업 텍스트 추출
    const formData = await request.formData();
    const imageFile = formData.get('image') as File;
    const jobText = formData.get('jobText') as string;

    // 입력 데이터 검증
    if (!imageFile) {
      return NextResponse.json(
        { error: '이미지 파일이 필요합니다.' },
        { status: 400 }
      );
    }

    if (!jobText) {
      return NextResponse.json(
        { error: '직업 텍스트가 필요합니다.' },
        { status: 400 }
      );
    }

    // 이미지 파일 형식 검증
    if (!imageFile.type.startsWith('image/')) {
      return NextResponse.json(
        { error: '올바른 이미지 파일을 업로드해주세요.' },
        { status: 400 }
      );
    }

    // 프롬프트 생성 - 더 창의적이고 재미있게 구성
    const prompt = `A professional portrait of a person working as a "${jobText}" in a fun, creative, and modern style. The person should be wearing appropriate attire and be in a relevant work environment. High quality, detailed, photorealistic, good lighting, professional photography style.`;

    // Stability AI API에 보낼 FormData 생성
    const stabilityFormData = new FormData();
    stabilityFormData.append('init_image', imageFile);
    stabilityFormData.append('init_image_mode', 'IMAGE_STRENGTH');
    stabilityFormData.append('image_strength', '0.6');
    stabilityFormData.append('text_prompts[0][text]', prompt);
    stabilityFormData.append('text_prompts[0][weight]', '1');
    stabilityFormData.append('cfg_scale', '7');
    stabilityFormData.append('samples', '1');
    stabilityFormData.append('steps', '30');
    // image-to-image에서는 width/height 설정 불가 (출력 크기는 입력 이미지와 동일)

    // Stability AI API 호출
    console.log('Sending request to Stability AI API...');
    const response = await fetch(
      'https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/image-to-image',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json',
        },
        body: stabilityFormData,
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Stability AI API Error:', response.status, errorText);
      
      if (response.status === 401) {
        return NextResponse.json(
          { error: 'Stability AI API 키가 유효하지 않습니다.' },
          { status: 401 }
        );
      }
      
      if (response.status === 402) {
        return NextResponse.json(
          { error: 'Stability AI 크레딧이 부족합니다.' },
          { status: 402 }
        );
      }

      // 더 자세한 에러 정보 제공
      let errorMessage = 'AI 이미지 생성 중 오류가 발생했습니다.';
      try {
        const errorData = JSON.parse(errorText);
        if (errorData.message) {
          errorMessage = errorData.message;
        }
      } catch {
        // JSON 파싱 실패 시 기본 메시지 사용
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }

    // 응답 데이터 파싱
    const result = await response.json();
    console.log('Stability AI API Response received');

    // 생성된 이미지가 있는지 확인
    if (!result.artifacts || result.artifacts.length === 0) {
      return NextResponse.json(
        { error: '이미지 생성에 실패했습니다.' },
        { status: 500 }
      );
    }

    // 첫 번째 생성된 이미지 데이터 추출
    const generatedImage = result.artifacts[0];
    
    // Base64 이미지 데이터 반환
    return NextResponse.json({
      success: true,
      message: '이미지가 성공적으로 생성되었습니다!',
      imageData: generatedImage.base64,
      jobText: jobText,
      prompt: prompt
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// GET 요청에 대한 처리 (API 상태 확인용)
export async function GET() {
  return NextResponse.json({
    message: 'AI Job Image Generator API',
    status: 'active',
    endpoints: {
      'POST /api/generate': 'Generate job-themed images'
    }
  });
} 