import { Routes } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { AuthGuard } from './guards/auth.guard.spec';
import { HomeComponent } from './home/home/home.component';
import { AdminDashboardComponent } from './admin/admin-dashboard/admin-dashboard.component';
import { CategoryComponent } from './admin/category/category.component';
import { ProductComponent } from './admin/product/product.component';
import { ProductListComponent } from './home/product-list/product-list.component';
import { OrderListComponent } from './home/order-list/order-list.component';
import { CartComponent } from './home/cart/cart.component';
import { CheckoutComponent } from './home/checkout/checkout.component';

export const routes: Routes = [ { path: '', redirectTo: 'home', pathMatch: 'full' },
    {
      path: '',
      children: [
        { path: 'login', component: LoginComponent },
        { path: 'register', component: RegisterComponent },
        {path:'product',component:ProductListComponent},
        {path:'orderlist',component:OrderListComponent},
        {path:'cart',component:CartComponent},
        {path:'checkout',component:CheckoutComponent}
      ],
    },
    {
      path: '',component:HomeComponent
     
    },
    { path: 'admin', component: AdminDashboardComponent },
    { path: 'admin/categories', component: CategoryComponent },
    { path: 'admin/products', component: ProductComponent },
  
    { path: '**', redirectTo: 'auth/login' },
  ];
