import { Component } from '@angular/core';
import { Footer } from "../../components/footer/footer";
import { RouterOutlet } from "@angular/router";

@Component({
  selector: 'app-main-layout',
  imports: [Footer, RouterOutlet],
  templateUrl: './main-layout.html',
})
export class MainLayout {

}
