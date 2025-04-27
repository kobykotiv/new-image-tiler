use base64::{engine::general_purpose, Engine as _};
use image::{DynamicImage, GenericImage, GenericImageView, ImageBuffer, Rgba};
use serde::{Deserialize, Serialize};
use std::io::Cursor;
use thiserror::Error;

#[derive(Error, Debug, Serialize)]
pub enum TilerError {
    #[error("Image decoding error: {0}")]
    ImageDecode(String),
    #[error("Image processing error: {0}")]
    ImageProcessing(String),
    #[error("Invalid input: {0}")]
    InvalidInput(String),
    #[error("Base64 decoding error: {0}")]
    Base64Decode(String),
    #[error("IO error: {0}")]
    Io(String),
}

// Helper to convert TilerError to a String suitable for Tauri result
impl From<TilerError> for String {
    fn from(error: TilerError) -> Self {
        error.to_string()
    }
}

#[derive(Deserialize)]
pub struct TileArgs {
    images_base64: Vec<String>,
    grid_cols: u32,
    grid_rows: u32,
}

// Decodes a base64 image string (removing data URL prefix if present)
fn decode_base64_image(base64_str: &str) -> Result<DynamicImage, TilerError> {
    let b64_data = base64_str
        .split(',')
        .nth(1)
        .unwrap_or(base64_str); // Handle optional "data:image/png;base64," prefix
    let image_bytes = general_purpose::STANDARD
        .decode(b64_data)
        .map_err(|e| TilerError::Base64Decode(e.to_string()))?;
    image::load_from_memory(&image_bytes)
        .map_err(|e| TilerError::ImageDecode(e.to_string()))
}

#[tauri::command]
pub fn tile_images(args: TileArgs) -> Result<String, String> {
    if args.images_base64.is_empty() {
        return Err(TilerError::InvalidInput("No images provided.".to_string()).into());
    }
    if args.grid_cols == 0 || args.grid_rows == 0 {
        return Err(TilerError::InvalidInput("Grid dimensions must be greater than zero.".to_string()).into());
    }

    let num_tiles = (args.grid_cols * args.grid_rows) as usize;
    if args.images_base64.len() != num_tiles {
        return Err(TilerError::InvalidInput(format!(
            "Incorrect number of images provided. Expected {}, got {}.",
            num_tiles,
            args.images_base64.len()
        ))
        .into());
    }

    // Decode all images first to find max dimensions
    let mut decoded_images = Vec::with_capacity(num_tiles);
    let mut max_width = 0;
    let mut max_height = 0;

    for base64_str in &args.images_base64 {
        let img = decode_base64_image(base64_str)?;
        max_width = max_width.max(img.width());
        max_height = max_height.max(img.height());
        decoded_images.push(img);
    }

    if max_width == 0 || max_height == 0 {
        return Err(TilerError::InvalidInput("Could not determine valid image dimensions.".to_string()).into());
    }

    let output_width = max_width * args.grid_cols;
    let output_height = max_height * args.grid_rows;
    let mut output_image = ImageBuffer::<Rgba<u8>, Vec<u8>>::new(output_width, output_height);

    // Tile images
    for (index, img) in decoded_images.iter().enumerate() {
        let row = (index as u32) / args.grid_cols;
        let col = (index as u32) % args.grid_cols;
        let x_offset = col * max_width;
        let y_offset = row * max_height;

        // Resize image to max dimensions if needed (simple nearest neighbor for now)
        // More sophisticated resizing could be added later.
        let resized_img = if img.width() != max_width || img.height() != max_height {
             img.resize_exact(max_width, max_height, image::imageops::FilterType::Nearest)
        } else {
            img.clone() // Use clone if no resize needed
        };


        // Copy resized image onto the output buffer
        // Use copy_from which handles potential out-of-bounds safely if dimensions mismatch somehow
        match output_image.copy_from(&resized_img, x_offset, y_offset) {
             Ok(_) => {},
             Err(e) => return Err(TilerError::ImageProcessing(format!("Failed to copy tile at index {}: {}", index, e)).into()),
        }
    }

    // Encode the final image to PNG and then to base64
    let mut buf = Cursor::new(Vec::new());
    output_image
        .write_to(&mut buf, image::ImageOutputFormat::Png)
        .map_err(|e| TilerError::Io(e.to_string()))?;
    let base64_output = general_purpose::STANDARD.encode(buf.get_ref());
    let data_url = format!("data:image/png;base64,{}", base64_output);

    Ok(data_url)
}

#[cfg(feature = "build")]
pub fn build() {
    tauri_build::build()
}

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![greet, tile_images])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
