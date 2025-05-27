// src/app/login/login.page.ts

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { SupabaseService } from '../../services/supabase.service';
import { Router } from '@angular/router';
import { AuthChangeEvent, Session } from '@supabase/supabase-js'; // Importa los tipos necesarios

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule]
})
export class LoginPage implements OnInit {
  email = '';
  password = '';

  constructor(private supabaseService: SupabaseService, private router: Router) {}

  ngOnInit() {
    
    this.supabaseService.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => { // CAMBIADO
      if (session) {
        this.router.navigateByUrl('/home', { replaceUrl: true });
      }
    });
  }

  async signIn() {
    const { error } = await this.supabaseService.signIn(this.email, this.password);
    if (error) {
      console.error('Error al iniciar sesión:', error.message);
      // Mostrar un Toast o Alert al usuario
    }
  }

  async signUp() {
    const { error } = await this.supabaseService.signUp(this.email, this.password);
    if (error) {
      console.error('Error al registrarse:', error.message);
      // Mostrar un Toast o Alert al usuario
    } else {
      // Registro exitoso, quizás redirigir o mostrar un mensaje
      this.signIn();
    }
  }
}