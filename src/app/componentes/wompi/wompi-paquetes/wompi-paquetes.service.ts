import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';

const apiUrl = environment.apiUrl + '/auth';

  export class WompiPaquetesService {
  }