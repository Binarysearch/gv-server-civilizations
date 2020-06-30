import { Injectable } from "@piros/ioc";
import { Observable, forkJoin } from "rxjs";
import { Star } from "../model/star";
import { DatabaseService } from "@piros/gv-server-commons";
import { map } from "rxjs/operators";

@Injectable
export class StarsDao {

    constructor(
        private ds: DatabaseService
    ) {
        
    }

    public getStarsByIds(starIds: string[]): Observable<Star[]> {
        return this.ds.getAll<Star>(
            `
            SELECT
                id,
                name,
                type,
                size,
                x,
                y
            FROM
                stars
            WHERE
                id IN (${starIds.map((id,i) => `$${i + 1}`)});
        `, starIds);
    }

    public getStars(): Observable<Star[]> {
        return this.ds.getAll<Star>(
            `
            SELECT
                id,
                name,
                type,
                size,
                x,
                y
            FROM
                stars;
        `, []);
    }

    public getExploredStars(civilizationId: string): Observable<string[]> {
        return this.ds.getAll<Star>(
            `
            SELECT
                star as id
            FROM
                known_stars
            WHERE civilization = $1;
        `, [ civilizationId ]).pipe(map(stars => stars.map(star => star.id)));
    }

    public getStarsWithPresence(civilizationId: string): Observable<string[]> {
        return this.ds.getAll<Star>(
            `
            SELECT
                star as id
            FROM
                visible_stars
            WHERE civilization = $1 AND quantity > 0;
        `, [ civilizationId ]).pipe(map(stars => stars.map(star => star.id)));
    }

    public getRandomUnexploredStar(): Observable<Star> {
        return this.ds.getOne<Star>(
            `
            SELECT
                id,
                name,
                type,
                size,
                x,
                y
            FROM
                stars
            WHERE
                NOT explored
            LIMIT 1;
        `, []);
    }

    public saveStars(stars: Star[]): Observable<void> {

        const values = stars.map(s => {
            return `('${s.id}', '${s.name}', '${s.type}', '${s.size}', '${s.x}', '${s.y}', 'false')`;
        }).join(',');

        const insertQuery = `
            INSERT INTO stars(
                id,
                name,
                type,
                size,
                x,
                y,
                explored
            ) VALUES ${values};
        `;
        return this.ds.execute(insertQuery, []);
    }

    public saveKnownStars(knownStars: { starId: string, civilizationId: string }[]): Observable<void> {

        const values = knownStars.map(s => {
            return `('${s.starId}', '${s.civilizationId}')`;
        }).join(',');

        const insertQuery = `
            INSERT INTO known_stars(
                star,
                civilization
            ) VALUES ${values};
        `;
        return this.ds.execute(insertQuery, []);
    }

    public addVisibilityToStar(vs: { starId: string, civilizationId: string, quantity: number; }): Observable<void> {

        const query = `
        UPDATE visible_stars SET quantity = quantity + ${vs.quantity} WHERE star = '${vs.starId}' AND civilization = '${vs.civilizationId}';
        INSERT INTO visible_stars(
            star,
            civilization,
            quantity
        ) 
        SELECT '${vs.starId}', '${vs.civilizationId}', ${vs.quantity} WHERE NOT EXISTS(SELECT 1 FROM visible_stars vs WHERE vs.star = '${vs.starId}' AND vs.civilization = '${vs.civilizationId}');
        `;
        return this.ds.execute(query, [ ]);
    }

    public getViewerUserIdsInStars(starIds: string[]): Observable<{ userId: string }[]> {
        return this.ds.getAll(`
        SELECT
            c."user" as "userId"
        FROM
            civilizations c JOIN visible_stars vs ON vs.civilization = c.id
        WHERE
            vs.quantity > 0 AND vs.star IN (${starIds.map((id,i) => `$${i + 1}`)});
        `, starIds);
    }

    public getStarCivilizationVisibility(starId: string, civilizationId: string): Observable<number> {
        return this.ds.getOne<{ quantity: number; }>(`
        SELECT
            vs.quantity
        FROM
            visible_stars vs
        WHERE
            vs.star = $1 AND vs.civilization = $2;
        `, [ starId, civilizationId ])
        .pipe(
            map(result => {
                if (!result) {
                    return 0;
                } else {
                    return result.quantity;
                }
            })
        );
    }

    public canCivilizationViewStar(civilizationId: string, starId: string): Observable<boolean> {
        return this.ds.getOne<any>(`
        SELECT
            1
        FROM
            visible_stars vs
        WHERE
            vs.civilization = $1 AND vs.star = $2;
        `, [ civilizationId, starId ]).pipe(map(r => r !== undefined));
    }

    public markStarAsExplored(starId: string): Observable<void> {
        return this.ds.execute(`UPDATE stars SET explored = true WHERE id = $1;`, [ starId ]);
    }
    
}