
import { NextResponse } from "next/server";

export const runtime = "nodejs";

const ALLOWED_TYPES = {
  pothole: "Pothole",
  road: "Road damage",
  light: "Streetlight",
  garbage: "Garbage",
};

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

function jsonError(message, status) {
  return NextResponse.json({ message }, { status });
}

export async function POST(request) {
  try {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return jsonError("Groq API key is not configured.", 500);
    }

    // Support both JSON and FormData requests.
    const contentType = request.headers.get("content-type") || "";
    let rawImage;
    let mimeType = "image/jpeg";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();

      rawImage =
        formData.get("image") ??
        formData.get("photo") ??
        formData.get("file");

      if (rawImage instanceof File) {
        if (!rawImage.size) {
          return jsonError("The uploaded image is empty.", 400);
        }

        if (rawImage.size > MAX_IMAGE_BYTES) {
          return jsonError("Image must be smaller than 10 MB.", 413);
        }

        mimeType = rawImage.type || "image/jpeg";

        if (
          !["image/jpeg", "image/png", "image/webp", "image/gif"].includes(
            mimeType
          )
        ) {
          return jsonError("Unsupported image format.", 400);
        }

        const buffer = Buffer.from(await rawImage.arrayBuffer());

        rawImage = `data:${mimeType};base64,${buffer.toString("base64")}`;
      }
    } else {
      const rawBody = await request.text();

      let body;

      try {
        body = JSON.parse(rawBody);
      } catch {
        console.error("INVALID REQUEST JSON:", {
          contentType,
          bodyStart: rawBody.slice(0, 80),
        });

        return jsonError(
          "Invalid request body. Send JSON or FormData containing an image.",
          400
        );
      }

      rawImage =
        body.image ??
        body.imageBase64 ??
        body.imageData ??
        body.photo ??
        body.file;
    }

    if (typeof rawImage !== "string" || !rawImage.trim()) {
      return jsonError(
        "Image not found. Send it using the image, photo, or file field.",
        400
      );
    }

    let imageUrl = rawImage.trim();

    // Convert plain base64 to a data URL.
    if (!imageUrl.startsWith("data:")) {
      imageUrl = `data:${mimeType};base64,${imageUrl}`;
    }

    const imageMatch = imageUrl.match(
      /^data:(image\/(?:jpeg|jpg|png|webp|gif));base64,([A-Za-z0-9+/=\s]+)$/i
    );

    if (!imageMatch) {
      return jsonError("Invalid image data or unsupported format.", 400);
    }

    const detectedMime = imageMatch[1].toLowerCase();
    const base64Data = imageMatch[2].replace(/\s/g, "");

    const imageBuffer = Buffer.from(base64Data, "base64");

    if (!imageBuffer.length || imageBuffer.length > MAX_IMAGE_BYTES) {
      return jsonError("Image is empty or exceeds the 10 MB limit.", 413);
    }

    imageUrl = `data:${detectedMime};base64,${base64Data}`;

    // Call Groq Vision API.
    const response = await fetch(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model:
            process.env.GROQ_VISION_MODEL || "qwen/qwen3.8-27b",
          messages: [
            {
              role: "system",
              content: `
You are CivicFix AI, a civic issue image analysis assistant.

Analyze the image and classify the visible issue.

Return a JSON object with:
{
  "issueType": "pothole",
  "title": "Short issue title",
  "description": "Description of visible evidence",
  "severity": "medium",
  "confidence": 85
}

Rules:
- issueType must be pothole, road, light, garbage, or other.
- pothole means a pothole in the road.
- road means other road damage.
- light means a streetlight issue.
- garbage means visible litter or dumped waste.
- severity must be low, medium, or high.
- confidence must be a number from 0 to 100.
- Do not invent details or an exact location.
- Use other if no supported civic issue is visible.
- Return only valid JSON.
              `.trim(),
            },
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Analyze this image for a civic issue.",
                },
                {
                  type: "image_url",
                  image_url: { url: imageUrl },
                },
              ],
            },
          ],
          temperature: 0.2,
          max_completion_tokens: 500,
          response_format: { type: "json_object" },
        }),
        signal: AbortSignal.timeout(30000),
      }
    );

    const rawResponse = await response.text();

    if (!response.ok) {
      console.error("GROQ HTTP ERROR:", {
        status: response.status,
        response: rawResponse.slice(0, 1000),
      });

      if (response.status === 401) {
        return jsonError("Invalid Groq API key.", 401);
      }

      if (response.status === 429) {
        return jsonError(
          "Groq rate limit or usage quota reached. Try again later.",
          429
        );
      }

      return jsonError(
        "Groq API request failed. Check the server terminal for details.",
        502
      );
    }

    let groqData;

    try {
      groqData = JSON.parse(rawResponse);
    } catch {
      console.error(
        "GROQ RESPONSE WAS NOT JSON:",
        rawResponse.slice(0, 1000)
      );

      return jsonError("Groq returned an invalid response.", 502);
    }

    const content = groqData.choices?.[0]?.message?.content;

    if (typeof content !== "string" || !content.trim()) {
      console.error("GROQ EMPTY RESPONSE:", rawResponse.slice(0, 1000));

      return jsonError("Groq returned an empty response.", 502);
    }

    let result;

    try {
      result = JSON.parse(content);
    } catch {
      console.error("GROQ MODEL OUTPUT WAS NOT JSON:", content);

      return jsonError("AI returned an unreadable result.", 502);
    }

    const issueType = String(result.issueType || "")
      .trim()
      .toLowerCase();

    if (!Object.hasOwn(ALLOWED_TYPES, issueType)) {
      return jsonError(
        "No supported civic issue detected. Please upload a relevant photo.",
        422
      );
    }

    const severity = String(result.severity || "").toLowerCase();

    if (!["low", "medium", "high"].includes(severity)) {
      return jsonError("AI returned an invalid severity.", 502);
    }

    const confidence = Number(result.confidence);

    if (
      !Number.isFinite(confidence) ||
      confidence < 0 ||
      confidence > 100
    ) {
      return jsonError("AI returned an invalid confidence score.", 502);
    }

    return NextResponse.json({
      success: true,
      issueType,
      title:
        typeof result.title === "string" && result.title.trim()
          ? result.title.trim().slice(0, 150)
          : ALLOWED_TYPES[issueType],
      description:
        typeof result.description === "string" &&
        result.description.trim()
          ? result.description.trim().slice(0, 1000)
          : "A possible civic issue was detected.",
      severity,
      confidence,
    });
  } catch (error) {
    console.error("CIVICFIX AI ERROR:", {
      message: error?.message,
      name: error?.name,
      status: error?.status,
    });

    if (
      error?.name === "TimeoutError" ||
      error?.name === "AbortError"
    ) {
      return jsonError("AI request timed out. Please try again.", 504);
    }

    return jsonError("AI analysis failed. Please try again.", 502);
  }
}
