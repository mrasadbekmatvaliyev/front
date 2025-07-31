import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { NotificationService } from '../notification/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  codeForm: FormGroup;
  codeLength = 4;
  codeControls = Array(this.codeLength).fill(0);
  isSubmitted = false;

  constructor(private fb: FormBuilder, private http: HttpClient, private router: Router, private notificationService: NotificationService) {
    this.codeForm = this.fb.group({});
    for (let i = 0; i < this.codeLength; i++) {
      this.codeForm.addControl(i.toString(), this.fb.control('', [Validators.required, Validators.pattern('[0-9]')]));
    }

    this.codeForm.valueChanges.subscribe(() => {
      if (this.codeForm.valid && !this.isSubmitted) {
        this.verifyCode();
      }
    });
    
  }
  

  onInput(event: any, index: number) {
    const input = event.target;
    let value = input.value;

    // Faqat raqamlarni qabul qilish
    value = value.replace(/[^0-9]/g, '');
    input.value = value;
    
    // FormControl qiymatini yangilash
    this.codeForm.get(index.toString())?.setValue(value);

    if (value.length === 1 && index < this.codeLength - 1) {
      const nextInput = input.parentElement.children[index + 1];
      if (nextInput) nextInput.focus();
    }
  }

  onBackspace(event: any, index: number) {
    const input = event.target;
    if (!input.value && index > 0) {
      const prevInput = input.parentElement.children[index - 1];
      if (prevInput) prevInput.focus();
    }
  }

  onPaste(event: ClipboardEvent, index: number) {
    event.preventDefault();
    
    // Clipboard dan matnni olish
    const pastedText = event.clipboardData?.getData('text') || '';
    
    // Faqat raqamlarni ajratib olish
    const numbers = pastedText.replace(/[^0-9]/g, '');
    
    if (numbers.length > 0) {
      // Har bir raqamni tegishli inputga joylashtirish
      for (let i = 0; i < Math.min(numbers.length, this.codeLength); i++) {
        const targetIndex = index + i;
        if (targetIndex < this.codeLength) {
          this.codeForm.get(targetIndex.toString())?.setValue(numbers[i]);
          
          // Input elementining qiymatini ham yangilash
          const inputElement = event.target as HTMLInputElement;
          const targetInput = inputElement.parentElement?.children[targetIndex] as HTMLInputElement;
          if (targetInput) {
            targetInput.value = numbers[i];
          }
        }
      }
      
      // Oxirgi to'ldirilgan inputdan keyingisiga focus qilish
      const lastFilledIndex = Math.min(index + numbers.length - 1, this.codeLength - 1);
      const nextIndex = Math.min(lastFilledIndex + 1, this.codeLength - 1);
      const nextInput = (event.target as HTMLInputElement).parentElement?.children[nextIndex] as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }
  }

  verifyCode() {
    this.isSubmitted = true;

    const codeStr = Object.values(this.codeForm.value).join('');
    const code = parseInt(codeStr, 10);

    this.http.post('https://myjavauzapp.loca.lt/api/user/verify', { code })
      .subscribe({
        next: res => {
          console.log('✅ Kod to\'g\'ri:', res);
          this.notificationService.success('Kirish muvaffaqiyatli! Xush kelibsiz!', 4000);
          // Bosh sahifaga yo'naltirish
          setTimeout(() => {
            this.router.navigate(['/home']);
          }, 10); // 1 soniya kutib, keyin yo'naltirish
        },
        error: err => {
          console.error('❌ Xatolik:', err);
          this.notificationService.error('Kod noto\'g\'ri yoki eskirgan. Qaytadan urinib ko\'ring!', 4000);
          this.resetForm();
        }
      });
  }

  resetForm() {
    this.isSubmitted = false;
    this.codeForm.reset();
    setTimeout(() => {
      const firstInput = document.querySelector('.code-inputs input');
      if (firstInput) (firstInput as HTMLElement).focus();
    }, 0);
  }
}
