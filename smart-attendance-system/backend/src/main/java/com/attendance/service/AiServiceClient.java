package com.attendance.service;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.List;
import java.util.Map;

@Component
public class AiServiceClient {

    private final WebClient webClient;

    public AiServiceClient(@Qualifier("aiServiceWebClient") WebClient webClient) {
        this.webClient = webClient;
    }

    /**
     * Sends 1-5 registration images to the AI service to generate a face encoding.
     * Returns a JSON string representing the averaged 128-d encoding.
     */
    public String generateEncoding(List<MultipartFile> images) {
        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        for (MultipartFile image : images) {
            builder.part("images", image.getResource());
        }

        Map response = webClient.post()
                .uri("/generate-encoding")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(builder.build()))
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        if (response == null || !response.containsKey("encoding")) {
            throw new RuntimeException("AI service failed to generate face encoding");
        }
        return response.get("encoding").toString();
    }

    /**
     * Sends classroom images + list of known student encodings to AI service for recognition.
     * Returns list of matched roll numbers with confidence scores.
     */
    public Map<String, Object> recognizeFromImages(List<MultipartFile> images, String knownEncodingsJson) {
        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        for (MultipartFile image : images) {
            builder.part("images", image.getResource());
        }
        builder.part("known_encodings", knownEncodingsJson);

        Map response = webClient.post()
                .uri("/attendance/from-images")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(builder.build()))
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        return response;
    }

    /**
     * Sends 1-3 classroom videos + known encodings to AI service for frame-by-frame recognition.
     * The AI service processes all videos and returns a combined, deduplicated list.
     */
    public Map<String, Object> recognizeFromVideo(List<MultipartFile> videos, String knownEncodingsJson) {
        MultipartBodyBuilder builder = new MultipartBodyBuilder();
        for (MultipartFile video : videos) {
            builder.part("videos", video.getResource());
        }
        builder.part("known_encodings", knownEncodingsJson);

        Map response = webClient.post()
                .uri("/attendance/from-video")
                .contentType(MediaType.MULTIPART_FORM_DATA)
                .body(BodyInserters.fromMultipartData(builder.build()))
                .retrieve()
                .bodyToMono(Map.class)
                .block();

        return response;
    }
}
