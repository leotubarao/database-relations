import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) throw new AppError('Customer not found.', 400);

    const findProducts = await this.productsRepository.findAllById(products);

    if (findProducts.length === 0)
      throw new AppError('Product not found.', 400);

    const orderProducts = findProducts.map(product => {
      const findProduct = products.find(({ id }) => id === product.id);

      if (!findProduct) throw new AppError('Quantity not available.', 404);

      return {
        product_id: product.id,
        price: product.price,
        quantity: findProduct?.quantity || 1,
      };
    });

    const order = await this.ordersRepository.create({
      customer,
      products: orderProducts,
    });

    await this.productsRepository.updateQuantity(products);

    return order;
  }
}

export default CreateOrderService;
