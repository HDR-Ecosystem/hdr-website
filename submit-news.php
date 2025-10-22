/*
<?php
header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 0);

$response = ['success' => false, 'message' => ''];

try {
    // Validate required fields
    if (empty($_POST['title']) || empty($_POST['date']) || empty($_POST['link']) || empty($_POST['description'])) {
        throw new Exception('All fields are required.');
    }

    // Handle image upload
    if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
        throw new Exception('Image upload failed.');
    }

    $allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
    $fileType = $_FILES['image']['type'];
    
    if (!in_array($fileType, $allowedTypes)) {
        throw new Exception('Invalid image type. Only JPG, PNG, GIF, and WEBP allowed.');
    }

    // Check file size (5MB max)
    if ($_FILES['image']['size'] > 5 * 1024 * 1024) {
        throw new Exception('Image too large. Maximum size is 5MB.');
    }

    // Generate unique filename
    $extension = pathinfo($_FILES['image']['name'], PATHINFO_EXTENSION);
    $filename = 'news_' . time() . '_' . uniqid() . '.' . $extension;
    $uploadPath = __DIR__ . '/images/' . $filename;

    // Move uploaded file
    if (!move_uploaded_file($_FILES['image']['tmp_name'], $uploadPath)) {
        throw new Exception('Failed to save image.');
    }

    // Read existing pending news data
    $jsonFile = __DIR__ . '/data/pending-news.json';
    $newsData = [];
    
    if (file_exists($jsonFile)) {
        $jsonContent = file_get_contents($jsonFile);
        $newsData = json_decode($jsonContent, true);
        if (!is_array($newsData)) {
            $newsData = [];
        }
    }

    // Format the date from YYYY-MM-DD to "Oct 5, 2025"
    $dateObj = new DateTime($_POST['date']);
    $formattedDate = $dateObj->format('M j, Y');

    // Create new news entry with pending status
    $newNews = [
        'title' => htmlspecialchars($_POST['title'], ENT_QUOTES, 'UTF-8'),
        'date' => $formattedDate,
        'img' => '../images/' . $filename,
        'link' => filter_var($_POST['link'], FILTER_SANITIZE_URL),
        'description' => htmlspecialchars($_POST['description'], ENT_QUOTES, 'UTF-8'),
        'status' => 'pending',
        'submitted_at' => date('Y-m-d H:i:s')
    ];

    // Add to beginning of array (newest first)
    array_unshift($newsData, $newNews);

    // Save to pending JSON file
    if (file_put_contents($jsonFile, json_encode($newsData, JSON_PRETTY_PRINT))) {
        $response['success'] = true;
        $response['message'] = 'News submitted successfully and is pending admin approval!';
    } else {
        throw new Exception('Failed to save news data.');
    }

} catch (Exception $e) {
    $response['message'] = $e->getMessage();
    
    // Clean up uploaded file if JSON save failed
    if (isset($uploadPath) && file_exists($uploadPath)) {
        unlink($uploadPath);
    }
}

echo json_encode($response);
?>
*/