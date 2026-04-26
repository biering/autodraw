use resvg::tiny_skia::{Color, Pixmap, Transform};
use std::fs;

#[tauri::command]
pub fn export_diagram_pdf(svg: String, path: String) -> Result<(), String> {
    let tree = usvg::Tree::from_str(&svg, &usvg::Options::default()).map_err(|e| e.to_string())?;
    let pdf = svg2pdf::to_pdf(
        &tree,
        svg2pdf::ConversionOptions::default(),
        svg2pdf::PageOptions::default(),
    )
    .map_err(|e| e.to_string())?;
    fs::write(path, pdf).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn export_diagram_png(svg: String, path: String, scale: f32) -> Result<(), String> {
    let tree = usvg::Tree::from_str(&svg, &usvg::Options::default()).map_err(|e| e.to_string())?;
    let size = tree.size().to_int_size();
    let w = ((size.width() as f32) * scale).round().max(1.0) as u32;
    let h = ((size.height() as f32) * scale).round().max(1.0) as u32;
    let mut pixmap = Pixmap::new(w, h).ok_or_else(|| "Failed to allocate pixmap".to_string())?;
    pixmap.fill(Color::WHITE);
    resvg::render(&tree, Transform::from_scale(scale, scale), &mut pixmap.as_mut());
    pixmap.save_png(path).map_err(|e| e.to_string())
}
