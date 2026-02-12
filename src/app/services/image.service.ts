import { Injectable } from '@angular/core';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

@Injectable({
  providedIn: 'root'
})

/**
 * Serviço responsável pela gestão de imagens usando o plugin Capacitor Camera.
 * Permite ao utilizador selecionar imagens da galeria do dispositivo.
 */
export class ImageService {

  /** Construtor vazio do serviço de imagens. */
  constructor() {}

  /**
   * Abre a galeria do dispositivo para o utilizador escolher uma imagem.
   * A imagem é retornada em formato DataUrl (base64) para ser armazenada facilmente.
   * 
   * @returns Promise com a DataUrl da imagem selecionada ou null em caso de erro/cancelamento.
   */
  async pickFromGallery(): Promise<string | null> {
    try {
      const image = await Camera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Photos
      });

      return image.dataUrl || null;
    } catch (error) {
      console.error('Erro ao escolher imagem:', error);
      return null;
    }
  }
}
