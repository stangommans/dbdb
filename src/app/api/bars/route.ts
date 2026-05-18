import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const bars = await db.bar.findMany({
      include: {
        reviews: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Process bars to calculate custom aggregations
    const aggregatedBars = bars.map((bar) => {
      const reviewCount = bar.reviews.length;
      
      if (reviewCount === 0) {
        return {
          id: bar.id,
          name: bar.name,
          address: bar.address,
          latitude: bar.latitude,
          longitude: bar.longitude,
          googlePlaceId: bar.googlePlaceId,
          amenities: bar.amenities,
          createdAt: bar.createdAt,
          updatedAt: bar.updatedAt,
          reviewCount: 0,
          averageDiveScore: 0,
          averagePricePerMl: null,
          averageRelativePrice: null,
          murkinessStats: { MURKY: 0, AVERAGE: 0, ACTUALLY_NICE: 0 },
          reviews: [],
        };
      }

      let totalDiveScore = 0;
      let totalRelativePrice = 0;
      let relativePriceCount = 0;
      let totalPricePerMl = 0;
      let pricePerMlCount = 0;
      
      const murkinessStats = { MURKY: 0, AVERAGE: 0, ACTUALLY_NICE: 0 };

      bar.reviews.forEach((review) => {
        totalDiveScore += review.diveScore;
        
        if (review.relativePrice !== null && review.relativePrice !== undefined) {
          totalRelativePrice += review.relativePrice;
          relativePriceCount++;
        }
        
        if (review.pricePerMl !== null && review.pricePerMl !== undefined) {
          totalPricePerMl += review.pricePerMl;
          pricePerMlCount++;
        }
        
        if (review.murkiness) {
          const key = review.murkiness as keyof typeof murkinessStats;
          if (murkinessStats[key] !== undefined) {
            murkinessStats[key]++;
          }
        }
      });

      return {
        id: bar.id,
        name: bar.name,
        address: bar.address,
        latitude: bar.latitude,
        longitude: bar.longitude,
        googlePlaceId: bar.googlePlaceId,
        amenities: bar.amenities,
        createdAt: bar.createdAt,
        updatedAt: bar.updatedAt,
        reviewCount,
        averageDiveScore: totalDiveScore / reviewCount,
        averagePricePerMl: pricePerMlCount > 0 ? totalPricePerMl / pricePerMlCount : null,
        averageRelativePrice: relativePriceCount > 0 ? totalRelativePrice / relativePriceCount : null,
        murkinessStats,
        reviews: bar.reviews,
      };
    });

    return NextResponse.json(aggregatedBars);
  } catch (error) {
    console.error('Error fetching bars:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, address, latitude, longitude, googlePlaceId, amenities } = body;

    if (!name || !address || latitude === undefined || longitude === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if googlePlaceId already exists to prevent duplicate imports
    if (googlePlaceId) {
      const existingBar = await db.bar.findUnique({
        where: { googlePlaceId },
      });
      
      if (existingBar) {
        return NextResponse.json(existingBar, { status: 200 }); // Return existing bar cleanly
      }
    }

    const newBar = await db.bar.create({
      data: {
        name,
        address,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        googlePlaceId: googlePlaceId || null,
        amenities: amenities || null,
      },
    });

    return NextResponse.json(newBar, { status: 201 }); // Created new
  } catch (error) {
    console.error('Error creating bar:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
