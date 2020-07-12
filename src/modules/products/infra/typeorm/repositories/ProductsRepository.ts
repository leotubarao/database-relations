import { getRepository, Repository, In } from 'typeorm';

import AppError from '@shared/errors/AppError';
import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICreateProductDTO from '@modules/products/dtos/ICreateProductDTO';
import IUpdateProductsQuantityDTO from '@modules/products/dtos/IUpdateProductsQuantityDTO';
import Product from '../entities/Product';

interface IFindProducts {
  id: string;
}

class ProductsRepository implements IProductsRepository {
  private ormRepository: Repository<Product>;

  constructor() {
    this.ormRepository = getRepository(Product);
  }

  public async create({
    name,
    price,
    quantity,
  }: ICreateProductDTO): Promise<Product> {
    const product = this.ormRepository.create({
      name,
      price,
      quantity,
    });

    await this.ormRepository.save(product);

    return product;
  }

  public async findByName(name: string): Promise<Product | undefined> {
    const findProduct = await this.ormRepository.findOne({
      where: {
        name,
      },
    });

    return findProduct;
  }

  public async findAllById(products: IFindProducts[]): Promise<Product[]> {
    const findProducts = await this.ormRepository.find({
      where: { order_products: In([...products]) },
    });

    return findProducts;
  }

  public async updateQuantity(
    products: IUpdateProductsQuantityDTO[],
  ): Promise<Product[]> {
    const updateProductsQuantity = products.map(async product => {
      const findProduct = await this.ormRepository.findOne({
        id: product.id,
      });

      if (!findProduct) throw new AppError('Product not found.', 400);

      if (findProduct.quantity < product.quantity)
        throw new AppError('Products insufficient quantities.', 400);

      findProduct.quantity -= product.quantity;

      return this.ormRepository.save(findProduct);
    });

    const productsPromises = await Promise.all(updateProductsQuantity);

    return productsPromises;
  }
}

export default ProductsRepository;
