import { NextRequest, NextResponse } from 'next/server';

// 이미지 리사이즈 함수
async function resizeImage(file: File, targetWidth: number, targetHeight: number): Promise<File> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      
      if (ctx) {
        // 이미지를 캔버스에 그리기 (비율 유지하면서 크롭)
        const scale = Math.max(targetWidth / img.width, targetHeight / img.height);
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        const x = (targetWidth - scaledWidth) / 2;
        const y = (targetHeight - scaledHeight) / 2;
        
        ctx.fillStyle = '#FFFFFF'; // 배경을 흰색으로
        ctx.fillRect(0, 0, targetWidth, targetHeight);
        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, { type: 'image/jpeg' });
            resolve(resizedFile);
          } else {
            reject(new Error('이미지 리사이즈 실패'));
          }
        }, 'image/jpeg', 0.9);
      } else {
        reject(new Error('Canvas context 생성 실패'));
      }
    };
    
    img.onerror = () => reject(new Error('이미지 로드 실패'));
    img.src = URL.createObjectURL(file);
  });
}

// 서버사이드에서 Sharp를 사용한 이미지 리사이즈
async function resizeImageServer(imageBuffer: Buffer, targetWidth: number, targetHeight: number): Promise<Buffer> {
  // Sharp 라이브러리 동적 import
  const sharp = (await import('sharp')).default;
  
  return await sharp(imageBuffer)
    .resize(targetWidth, targetHeight, {
      fit: 'cover',
      position: 'center',
      background: { r: 255, g: 255, b: 255 }
    })
    .jpeg({ quality: 90 })
    .toBuffer();
}

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

    // 이미지를 1024x1024로 리사이즈
    let processedImageFile: File;
    try {
      const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
      const resizedBuffer = await resizeImageServer(imageBuffer, 1024, 1024);
      processedImageFile = new File([resizedBuffer], imageFile.name, { type: 'image/jpeg' });
      console.log('이미지가 1024x1024로 리사이즈되었습니다.');
    } catch (resizeError) {
      console.error('이미지 리사이즈 실패:', resizeError);
      return NextResponse.json(
        { error: '이미지 처리 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 프롬프트 생성 - 더 창의적이고 재미있게 구성
    const prompt = `A professional portrait of a person working as a "${jobText}" in a fun, creative, and modern style. The person should be wearing appropriate attire and be in a relevant work environment. High quality, detailed, photorealistic, good lighting, professional photography style.`;

    // Stability AI API에 보낼 FormData 생성
    const stabilityFormData = new FormData();
    stabilityFormData.append('init_image', processedImageFile);
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