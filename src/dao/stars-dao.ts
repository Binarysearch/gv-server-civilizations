import { Injectable } from "@piros/ioc";
import { Observable } from "rxjs";
import { Star } from "../model/star";
import { DatabaseService } from "@piros/gv-server-commons";

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

    public saveVisibleStars(knownStars: { starId: string, civilizationId: string }[]): Observable<void> {

        const values = knownStars.map(s => {
            return `('${s.starId}', '${s.civilizationId}')`;
        }).join(',');

        const insertQuery = `
            INSERT INTO visible_stars(
                star,
                civilization
            ) VALUES ${values};
        `;
        return this.ds.execute(insertQuery, []);
    }

    public getViewerUserIdsInStars(starIds: string[]): Observable<{ userId: string }[]> {
        return this.ds.getAll(`
        SELECT
            c."user" as "userId"
        FROM
            civilizations c JOIN visible_stars vs ON vs.civilization = c.id
        WHERE
            vs.star IN (${starIds.map((id,i) => `$${i + 1}`)});
        `, starIds);
    }

    public markStarAsExplored(starId: string): Observable<void> {
        return this.ds.execute(`UPDATE stars SET explored = true WHERE id = $1;`, [ starId ]);
    }
    
}