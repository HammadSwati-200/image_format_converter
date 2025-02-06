 // DOM Elements
 const dropZone = document.getElementById('dropZone');
 const fileInput = document.getElementById('fileInput');
 const convertBtn = document.getElementById('convertBtn');
 const formatOptions = document.querySelectorAll('.format-option');
 const successModal = document.getElementById('successModal');
 const errorModal = document.getElementById('errorModal');
 const previewContainer = document.querySelector('.preview-container');
 const addMoreBtn = document.querySelector('.add-more-btn');
 // Global Variables
 let files = [];
 let selectedFormat = 'webp';
 
 // Event Listeners
 document.addEventListener('DOMContentLoaded', () => {
     // Format selection
     formatOptions.forEach(option => {
         option.addEventListener('click', () => {
             formatOptions.forEach(o => o.classList.remove('selected'));
             option.classList.add('selected');
             selectedFormat = option.querySelector('input').value;
         });
     });
 
     // Modal close buttons
     document.querySelectorAll('.close-modal').forEach(btn => {
         btn.addEventListener('click', () => {
             successModal.classList.remove('active');
             errorModal.classList.remove('active');
         });
     });
 
     // File handling
     dropZone.addEventListener('drop', handleDrop);
     dropZone.addEventListener('click', () => fileInput.click());
     fileInput.addEventListener('change', handleFileSelect);
     addMoreBtn.addEventListener('click', () => fileInput.click());
     convertBtn.addEventListener('click', startConversion);
    
 
     // Drag & drop handlers
     ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(event => {
         dropZone.addEventListener(event, preventDefaults);
     });
 
     ['dragenter', 'dragover'].forEach(event => {
         dropZone.addEventListener(event, highlight);
     });
 
     ['dragleave', 'drop'].forEach(event => {
         dropZone.addEventListener(event, unhighlight);
     });
     document.querySelector('input[value="webp"]').parentElement.classList.add('selected');
 });
 
 // Functions
 function preventDefaults(e) {
     e.preventDefault();
     e.stopPropagation();
 }
 
 function highlight() {
     dropZone.classList.add('dragover');
 }
 
 function unhighlight() {
     dropZone.classList.remove('dragover');
 }
 
 function handleDrop(e) {
     const dt = e.dataTransfer;
     handleFiles(dt.files);
 }
 
 // handleFileSelect
 function handleFileSelect(e) {
     handleFiles(e.target.files);
     e.target.value = ''; // Clear input for new selections
 }
 function handleFiles(newFiles) {
     Array.from(newFiles).forEach(file => {
         if (files.length >= 5) {
             showError('Maximum 5 images allowed');
             return;
         }
         
         if (!file.type.startsWith('image/')) {
             showError('Please select image files only');
             return;
         }
 
         if (file.size > 5 * 1024 * 1024) {
             showError('File size exceeds 5MB limit');
             return;
         }
 
         files.push(file);
         createPreview(file);
     });
 }
 
 // Update createPreview function
 function createPreview(file) {
     const previewItem = document.createElement('div');
     previewItem.className = 'preview-item';
     previewItem.innerHTML = `
         <div class="upload-loader"></div>
         <div class="remove-btn">×</div>
         <img class="preview-image" src="${URL.createObjectURL(file)}">
         <div class="converted-overlay">
             <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
             </svg>
         </div>
     `;
 
     previewItem.querySelector('.remove-btn').addEventListener('click', (e) => {
         e.stopPropagation();
         files = files.filter(f => f !== file);
         previewItem.remove();
         URL.revokeObjectURL(file);
     });
 
     previewContainer.insertBefore(previewItem, addMoreBtn);
 }
 
 
 async function startConversion() {
     if (files.length === 0) {
         showError('Please select images first');
         return;
     }
 
     try {
         convertBtn.disabled = true;
         const previewItems = Array.from(previewContainer.querySelectorAll('.preview-item:not(.add-more-btn)'));
 
         for (let i = 0; i < files.length; i++) {
             const file = files[i];
             const previewItem = previewItems[i];
             
             if (!previewItem) continue;
             
             previewItem.classList.add('converting');
             const converted = await convertFile(file);
             
             if (converted) {
                 previewItem.classList.add('converted');
                 previewItem.classList.remove('converting');
             }
         }
 
         showSuccess();
     } catch (error) {
         showError('Error converting images: ' + error.message);
     } finally {
         convertBtn.disabled = false;
         previewContainer.querySelectorAll('.preview-item').forEach(item => {
             item.classList.remove('converting');
         });
     }
 }
 
 async function convertFile(file) {
     return new Promise((resolve, reject) => {
         const img = new Image();
         img.onload = () => {
             try {
                 const canvas = document.createElement('canvas');
                 const ctx = canvas.getContext('2d');
                 canvas.width = img.width;
                 canvas.height = img.height;
                 ctx.drawImage(img, 0, 0);
 
                 const mimeType = `image/${selectedFormat === 'jpg' ? 'jpeg' : selectedFormat}`;
                 canvas.toBlob(blob => {
                     const url = URL.createObjectURL(blob);
                     const link = document.createElement('a');
                     link.download = `converted.${selectedFormat}`;
                     link.href = url;
                     link.click();
                     URL.revokeObjectURL(url);
                     resolve(true);
                 }, mimeType, 0.9);
             } catch (error) {
                 reject(error);
             }
         };
         img.onerror = error => reject(error);
         img.src = URL.createObjectURL(file);
     });
 }
 
 function showSuccess() {
     successModal.classList.add('active');
 }
 
 function showError(message) {
     errorModal.classList.add('active');
     document.getElementById('errorMessage').textContent = message;
 }